import { getAllFromStore, setPlaylistInStore } from "@/helpers/database";
import { syncTracksSavedStatus } from "@/helpers/fetchers";
import {
  showErrorNotif,
  showWarnNotif,
  syncSpotifyAndIdb,
} from "@/helpers/general";
import { getTrackFeatures } from "@/helpers/indexedDbHelpers";
import { getItemFromLocalStorage } from "@/helpers/localStorage";
import { startSearch } from "@/helpers/playlist";
import { FormValues, TopTrackObject, Track, TrackObject } from "@/types/types";
import {
  Accordion,
  Alert,
  Button,
  Checkbox,
  CheckIcon,
  Group,
  NumberInput,
  Progress,
  Radio,
  Select,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { modals } from "@mantine/modals";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { SearchableMultiSelect } from "../SearchableMultiSelect/searchableMultiSelect";
import styles from "./form.module.css";
import { chunk } from "lodash";
import { API_URL } from "@/helpers/fetchers";

interface FormProps {
  estimatedLoadTime: string;
  setHasSearched: React.Dispatch<React.SetStateAction<boolean>>;
  activeSourceTab: string | null;
  setActiveSourceTab: React.Dispatch<React.SetStateAction<string | null>>;
  loadingData: boolean;
  loadingDataProgress: number;
  storeSpotifyData: () => void;
  libraryStored: boolean;
  playlist: Map<string, TrackObject>;
  setPlaylist: React.Dispatch<React.SetStateAction<Map<string, TrackObject>>>;
  matchingTracks: Map<string, TrackObject>;
  setMatchingTracks: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject>>
  >;
  setLoadingPlaylist: React.Dispatch<React.SetStateAction<boolean>>;
  form: UseFormReturnType<FormValues>;
  anyTempo: boolean;
  halfTime: boolean;
  doubleTime: boolean;
  setAnyTempo: React.Dispatch<React.SetStateAction<boolean>>;
  setHalfTime: React.Dispatch<React.SetStateAction<boolean>>;
  setDoubleTime: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Form({
  estimatedLoadTime,
  setHasSearched,
  activeSourceTab,
  setActiveSourceTab,
  loadingData,
  loadingDataProgress,
  storeSpotifyData,
  libraryStored,
  playlist,
  setPlaylist,
  setMatchingTracks,
  setLoadingPlaylist,
  form,
  anyTempo,
  halfTime,
  doubleTime,
  setAnyTempo,
  setHalfTime,
  setDoubleTime,
}: FormProps) {
  const [chosenTags, setChosenTags] = useState<string[]>([]);
  const [savedTrackTags, setSavedTrackTags] = useState<string[]>([]);
  const [topTrackTags, setTopTrackTags] = useState<string[]>([]);
  const [source, setSource] = useState<string>("savedTracks");
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [userInputPlaylistId, setUserInputPlaylistId] = useState(
    "https://open.spotify.com/playlist/6uRb2P6XRj5ygnanxpMCfS?si=8d44b0cbc6c0478a"
  );
  const [loadingSpotifyPlaylist, setLoadingSpotifyPlaylist] =
    useState<boolean>(false);
  const [verifyingPlaylist, setVerifyingPlaylist] = useState<boolean>(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [invalidPlaylist, setInvalidPlaylist] = useState<boolean>(false);
  const [storedPlaylists, setStoredPlaylists] = useState<
    { name: string; id: string }[]
  >([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
  const icon = <IconInfoCircle />;

  // Get tags from IDB
  async function getTags() {
    // Check if tags are already in local storage
    const storedSavedTrackTags = JSON.parse(
      getItemFromLocalStorage("savedTrackTags") || "[]"
    );
    const storedTopTrackTags = JSON.parse(
      getItemFromLocalStorage("topTrackTags") || "[]"
    );

    // If tags are stored use those instead of fetching
    if (source === "savedTracks" && storedSavedTrackTags.length > 0) {
      setSavedTrackTags(storedSavedTrackTags);
      return;
    }

    if (source === "topTracks" && storedTopTrackTags.length > 0) {
      setTopTrackTags(storedTopTrackTags);
      return;
    }

    // If tags are not stored, fetch from IDB
    const tags: string[] = [];
    const tracks: TrackObject[] | TopTrackObject[] = await getAllFromStore(
      source as "savedTracks" | "topTracks"
    );

    for (const track of tracks) {
      const trackTags: string[] = track.features.tags;
      for (const trackTag of trackTags) {
        if (!tags.includes(trackTag)) {
          tags.push(trackTag);
        }
      }
    }

    // Store and set the new tags
    if (source === "topTracks") {
      localStorage.setItem("topTrackTags", JSON.stringify(tags));
      setTopTrackTags(tags);
    } else {
      localStorage.setItem("savedTrackTags", JSON.stringify(tags));
      setSavedTrackTags(tags);
    }
  }

  useEffect(() => {
    const fetchTags = async () => {
      await getTags();
    };

    fetchTags();
  }, [source]);

  async function handleSubmit(
    values: FormValues,
    activeSourceTab: string | null
  ) {
    setHasSearched(true);
    setLoadingPlaylist(true);

    // Search for matching tracks
    let matches: Map<string, TrackObject> | null | void = await startSearch(
      values,
      source,
      selectedPlaylist,
      anyTempo,
      halfTime,
      doubleTime,
      activeSourceTab,
      chosenTags
    );
    if (!matches) {
      showWarnNotif(
        "No matches found",
        "No tracks could be found that meet that criteria."
      );
      setPlaylist(new Map());
      setMatchingTracks(new Map());
      setLoadingPlaylist(false);
      return;
    }

    // Remove any tracks from matchingTracks that are already pinned in the playlist
    for (const key of matches.keys()) {
      if (playlist?.get(key)) {
        if (playlist.get(key)?.pinned) {
          matches.delete(key);
        }
      }
    }

    // Check if matching tracks are saved in Spotify library
    const syncedTracks: Map<string, TrackObject> | null =
      await syncTracksSavedStatus(matches);
    if (syncedTracks) {
      matches = syncedTracks; // Update matchingTracks to include up-to-date saved status
    } else {
      showWarnNotif(
        "Sign in to allow syncing with Spotify",
        "Tracks' displayed saved status may not reflect your Spotify library. Read more on GitHub."
      );
    }

    // For each matching track, sync IDB saved track status with the Spotify saved status
    // E.g. if one track is marked as unsaved in spotify but is saved in IDB, remove it from IDB
    for (const track of matches.values()) {
      const action = await syncSpotifyAndIdb(track, track.saved); // Adds or removes track from IDB depending on Spotify saved status
      if (action == -1) {
        // Track was removed from IDB
        // Remove from matching tracks if user is searching based on Saved Tracks
        if (values.source === "1") {
          matches.delete(track.track.id);
        }
      }
    }

    // If after removing pinned tracks/unsaved tracks from matches, matchingTracks.size is 0,
    // Return no matches found
    if (matches.size === 0) {
      showWarnNotif(
        "No matches found",
        "No tracks could be found that meet that criteria."
      );
      setPlaylist(new Map());
      setMatchingTracks(new Map());
      setLoadingPlaylist(false);
      return;
    }

    // Initialise newPlaylist
    let newPlaylist: Map<string, TrackObject> = new Map();

    // Add pinned tracks to newPlaylist
    if (playlist) {
      for (const [key, value] of playlist.entries()) {
        if (value.pinned === true) {
          newPlaylist.set(key, value);
        }
      }
    }

    // Add matching tracks to newPlaylist up to the target size
    if (newPlaylist.size < values.target) {
      const missingNumber: number = values.target - newPlaylist.size;

      // Slice matchingTracks to be the size of missingNumber, then add to newPlaylist
      const tempArray = Array.from(matches).slice(0, missingNumber);
      const newMap = new Map(tempArray);

      // Remove the matching tracks being added to the newPlaylist from matchingTracks
      for (const key of newMap.keys()) {
        matches.delete(key);
      }

      newPlaylist = new Map([...newPlaylist, ...newMap]);
    }

    setLoadingPlaylist(false);
    setPlaylist(newPlaylist);
    setMatchingTracks(matches);
  }

  const advancedFilters = {
    danceability: ["Any", "Danceable", "Not Danceable"],
    gender: ["Any", "Female", "Male"],
    acoustic: ["Any", "Acoustic", "Not Acoustic"],
    aggressive: ["Any", "Aggressive", "Not Aggressive"],
    electronic: ["Any", "Electronic", "Not Electronic"],
    happy: ["Any", "Happy", "Not Happy"],
    party: ["Any", "Party", "Not Party"],
    relaxed: ["Any", "Relaxed", "Not Relaxed"],
    sad: ["Any", "Sad", "Not Sad"],
    timbre: ["Any", "Bright", "Dark"],
  };

  function checkPlaylistExists() {
    let playlistExists: boolean = false;

    for (const playlist of storedPlaylists) {
      if (playlist.id === playlistId) {
        playlistExists = true;
      }
    }

    if (playlistExists) {
      openConfirmLoadPlaylistModal();
    } else {
      loadPlaylistData();
    }
  }

  async function getPlaylistMetadata(id: string) {
    setVerifyingPlaylist(true);
    setVerifiedName(null);
    setInvalidPlaylist(false);
    const token: string | null = getItemFromLocalStorage("guest_token");
    if (!token) {
      setVerifyingPlaylist(false);
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL}/spotify/playlist?playlistId=${encodeURIComponent(
          id
        )}&accessToken=${token}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch playlist data");
      }
      const data = await response.json();
      const name = data.name;
      name && setVerifiedName(name);
      setInvalidPlaylist(false);
    } catch (error: any) {
      showErrorNotif("Getting playlist data failed", error.message);
      setVerifiedName(null);
      setInvalidPlaylist(true);
    }
    setVerifyingPlaylist(false);
  }

  async function loadPlaylistData() {
    setLoadingSpotifyPlaylist(true);
    // Fetch playlist items from Spotify
    const token: string | null = getItemFromLocalStorage("guest_token");
    if (!token) {
      setLoadingSpotifyPlaylist(false);
      showErrorNotif("Error", "Could not find token. Try refreshing page.");
      return null;
    }

    if (!verifiedName) {
      setLoadingPlaylist(false);
      showErrorNotif("Error", "Playlist not verified. Can't load tracks.");
      return null;
    }

    if (!playlistId) {
      setVerifyingPlaylist(false);
      showErrorNotif("Error", "Invalid playlist id");
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL}/spotify/playlistItems?playlistId=${encodeURIComponent(
          playlistId
        )}&accessToken=${token}`
      );
      const data = await response.json();
      const tracks: Track[] = [];

      for (const item of data.items) {
        tracks.push(item.track);
      }

      // Chunk tracks to fetch features 25 at a time
      const tracksToStore: TrackObject[] = [];
      const chunks: Track[][] = chunk(tracks, 25);

      for (const chunk of chunks) {
        // Get each track's features from MetaBrainz
        const results: TrackObject[] | null = await getTrackFeatures(chunk);
        if (results) {
          tracksToStore.push(...results);
        }
      }

      if (tracksToStore) {
        // Store playlist name, tracks, and features
        try {
          await setPlaylistInStore({
            name: verifiedName,
            id: playlistId,
            tracks: tracksToStore,
          });
          setStoredPlaylists((prev) => {
            const filteredPlaylists = prev.filter(
              (playlist) => playlist.id !== playlistId
            );
            return [
              ...filteredPlaylists,
              { name: verifiedName, id: playlistId },
            ];
          });
          setPlaylistId("");
        } catch (error) {
          console.log("Error storing playlist in IDB", error);
        }
      } else {
        console.log("No playlist tracks to store");
      }
    } catch (error) {
      console.error("Storing playlist data failed.", error);
    }
    setLoadingSpotifyPlaylist(false);
  }

  // Check for any stored playlists on form mount
  useEffect(() => {
    const setPlaylistsInState = async () => {
      const idbPlaylists = await getAllFromStore("playlists");
      setStoredPlaylists(idbPlaylists);
    };
    setPlaylistsInState();
  }, []);

  const openConfirmLoadPlaylistModal = () =>
    modals.openConfirmModal({
      title: "Playlist already stored",
      children: (
        <Text size="sm">Are you sure you want to reload this playlist?</Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => loadPlaylistData(),
    });

  function extractPlaylistId() {
    // Extract id from link to spotify playlist: https://open.spotify.com/playlist/6uRb2P6XRj5ygnanxpMCfS?si=8d44b0cbc6c0478a --> 6uRb2P6XRj5ygnanxpMCfS
    const match = userInputPlaylistId.match(/\/playlist\/([^/?]+)/);
    if (match) {
      setPlaylistId(match[1]);
    } else {
      setPlaylistId("");
      return;
    }
    getPlaylistMetadata(match[1]);
  }

  return (
    <form
      className={styles.form}
      onSubmit={form.onSubmit((values) =>
        handleSubmit(values, activeSourceTab)
      )}
      onReset={form.onReset}
    >
      <Accordion defaultValue="Track Source">
        <Accordion.Item value="Track Source">
          <Accordion.Control>Tracks Source</Accordion.Control>
          <Accordion.Panel>
            <Tabs
              variant="outline"
              defaultValue="mySpotify"
              value={activeSourceTab}
              onChange={setActiveSourceTab}
            >
              <Tabs.List>
                <Tabs.Tab value="publicPlaylist">Public Playlist</Tabs.Tab>
                <Tabs.Tab value="mySpotify">My Spotify</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="mySpotify">
                {!libraryStored ? (
                  <div className={styles.mySpotify}>
                    <Alert
                      variant="light"
                      color="grape"
                      title="Demo only"
                      icon={icon}
                      className={styles.alert}
                    >
                      Some tracks may not be available. Read more{" "}
                      <a href="https://github.com/emoore29/cadence-demo">
                        here
                      </a>
                      .
                    </Alert>
                    <p>Estimated load time: {estimatedLoadTime}</p>
                    <p style={{ fontSize: "14px" }}>
                      {!loadingData ? "Load " : "Loading "}your track data
                    </p>
                    {!loadingData ? (
                      <Button
                        onClick={storeSpotifyData}
                        className={styles.loadLibraryBtn}
                      >
                        Load your track data
                      </Button>
                    ) : (
                      <Progress
                        value={loadingDataProgress}
                        size="lg"
                        transitionDuration={200}
                      />
                    )}
                  </div>
                ) : (
                  <Radio.Group
                    value={source}
                    onChange={setSource}
                    name="source"
                    label="Track Source"
                  >
                    <Group className={styles.source}>
                      <Radio
                        value="savedTracks"
                        icon={CheckIcon}
                        label="Saved Tracks"
                      />
                      <Radio
                        icon={CheckIcon}
                        label="Top Tracks"
                        value="topTracks"
                      />
                    </Group>
                  </Radio.Group>
                )}
              </Tabs.Panel>
              <Tabs.Panel value="publicPlaylist">
                <Radio.Group
                  value={selectedPlaylist}
                  onChange={setSelectedPlaylist}
                  name="selectedPlaylist"
                  label="Playlists"
                >
                  <Group className={styles.source}>
                    {storedPlaylists.map((storedPlaylist) => (
                      <Radio
                        key={storedPlaylist.id}
                        value={storedPlaylist.id}
                        icon={CheckIcon}
                        label={storedPlaylist.name}
                      />
                    ))}
                  </Group>
                </Radio.Group>
                <TextInput
                  label="Playlist id (link to public user-created Spotify playlist)"
                  value={userInputPlaylistId}
                  onChange={(event) => {
                    setUserInputPlaylistId(event.currentTarget.value); // Update user input as they type
                  }}
                />
                <Button onClick={() => extractPlaylistId()}>
                  {verifyingPlaylist ? "Verifying playlist" : "Verify playlist"}
                </Button>
                {invalidPlaylist && (
                  <Text>
                    Invalid playlist. Please check your playlist is a public
                    playlist owned by a Spotify user.
                  </Text>
                )}
                {verifiedName && (
                  <>
                    <Text>You submitted playlist: {verifiedName}.</Text>
                    <Button onClick={() => checkPlaylistExists()}>
                      {!loadingSpotifyPlaylist
                        ? "Load playlist data"
                        : "Loading playlist data"}
                    </Button>
                  </>
                )}
              </Tabs.Panel>
            </Tabs>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="Target Length">
          <Accordion.Control>Target Length</Accordion.Control>
          <Accordion.Panel>
            <NumberInput
              label="Target number of tracks"
              key={form.key("target")}
              placeholder="20"
              {...form.getInputProps("target")}
              stepHoldDelay={500}
              stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
            />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="BPM">
          <Accordion.Control>Tempo</Accordion.Control>
          <Accordion.Panel>
            <Checkbox
              checked={anyTempo}
              label="Any"
              onChange={(event) => {
                const isChecked = event.currentTarget.checked;
                setAnyTempo(isChecked);
              }}
            />
            <Checkbox
              label="Include half-time"
              checked={halfTime}
              disabled={anyTempo}
              onChange={(event) => {
                const isChecked = event.currentTarget.checked;
                setHalfTime(isChecked);
              }}
            />
            <Checkbox
              label="Include double-time"
              checked={doubleTime}
              disabled={anyTempo}
              onChange={(event) => {
                const isChecked = event.currentTarget.checked;
                setDoubleTime(isChecked);
              }}
            />
            <div className={styles.bpm}>
              <NumberInput
                label="Min Tempo"
                key={form.key("minTempo")}
                placeholder="Input placeholder"
                disabled={anyTempo}
                {...form.getInputProps("minTempo")}
                stepHoldDelay={500}
                stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
              />
              <NumberInput
                label="Max Tempo"
                key={form.key("maxTempo")}
                placeholder="Input placeholder"
                disabled={anyTempo}
                {...form.getInputProps("maxTempo")}
                stepHoldDelay={500}
                stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
              />
            </div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="Key">
          <Accordion.Control>Key</Accordion.Control>
          <Accordion.Panel>
            <Select
              key={form.key("key")}
              {...form.getInputProps("key")}
              label="Key"
              data={[
                "Any",
                "A",
                "A#",
                "B",
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
              ]}
              allowDeselect={false}
            />
            <Select
              key={form.key("mode")}
              {...form.getInputProps("mode")}
              label="Mode"
              data={["Any", "Major", "Minor"]}
              allowDeselect={false}
            />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="Tags">
          <Accordion.Control>Tags</Accordion.Control>
          <Accordion.Panel>
            <SearchableMultiSelect
              data={source == "savedTracks" ? savedTrackTags : topTrackTags}
              setChosenItems={setChosenTags}
            />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="Advanced">
          <Accordion.Control>Advanced</Accordion.Control>
          <Accordion.Panel>
            {Object.entries(advancedFilters).map(([key, values]) => (
              <Select
                key={form.key(key)}
                {...form.getInputProps(key)}
                label={key}
                data={values}
                allowDeselect={false}
              />
            ))}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <Group justify="flex-end" mt="md">
        <Button type="reset" onClick={() => setAnyTempo(false)}>
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </Group>
    </form>
  );
}
