import {
  ABFeaturesResponse,
  fetchTrackABFeatures,
  fetchTrackMBIDandTags,
  MBIDResponseData,
  searchTrackDeezer,
  syncTracksSavedStatus,
} from "@/helpers/fetchers";
import { showWarnNotif, syncSpotifyAndIdb } from "@/helpers/general";
import { startSearch } from "@/helpers/playlist";
import { ChosenSeeds, FormValues, TrackObject } from "@/types/types";
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
  Tooltip,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import CustomFilters from "../CustomFilters/customFilters";
import styles from "./form.module.css";
import { getTrackFromStore, setInStore } from "@/helpers/database";
import SavePlaylistModal from "../SavePlaylist/savePlaylist";
import { delay } from "@/helpers/indexedDbHelpers";

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
  setRecommendations: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject>>
  >;
  setLoadingPlaylist: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingRecs: React.Dispatch<React.SetStateAction<boolean>>;
  form: UseFormReturnType<FormValues>;
  anyTempo: boolean;
  setAnyTempo: React.Dispatch<React.SetStateAction<boolean>>;
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
  setRecommendations,
  setLoadingPlaylist,
  setLoadingRecs,
  form,
  anyTempo,
  setAnyTempo,
}: FormProps) {
  const [chosenSeeds, setChosenSeeds] = useState<ChosenSeeds>({
    genres: [],
    tracks: [],
    artists: [],
  });
  const icon = <IconInfoCircle />;

  async function handleSubmit(
    values: FormValues,
    anyTempo: boolean,
    activeSourceTab: string | null
  ) {
    setHasSearched(true);
    setLoadingPlaylist(true);

    // Search for matching tracks
    let matches: Map<string, TrackObject> | null | void = await startSearch(
      values,
      anyTempo,
      activeSourceTab,
      chosenSeeds
    );
    if (!matches) {
      showWarnNotif(
        "No matches found",
        "No tracks could be found that meet that criteria."
      );
      setPlaylist(new Map());
      setRecommendations(new Map());
      setMatchingTracks(new Map());
      setLoadingPlaylist(false);
      setLoadingRecs(false);
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
      setRecommendations(new Map());
      setMatchingTracks(new Map());
      setLoadingPlaylist(false);
      setLoadingRecs(false);
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

  return (
    <form
      className={styles.form}
      onSubmit={form.onSubmit((values) =>
        handleSubmit(values, anyTempo, activeSourceTab)
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
                <Tabs.Tab value="mySpotify">My Spotify</Tabs.Tab>
                <Tabs.Tab value="custom">Custom</Tabs.Tab>
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
                      Due to Spotify API deprecation, all track features may not
                      be available. Read more{" "}
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
                    name="source"
                    label="Track Source"
                    {...form.getInputProps("source")}
                  >
                    <Group className={styles.source}>
                      <Radio
                        value={"1"}
                        icon={CheckIcon}
                        label="Saved Tracks"
                      />
                      <Radio value={"2"} icon={CheckIcon} label="Top Tracks" />
                    </Group>
                  </Radio.Group>
                )}
              </Tabs.Panel>
              <Tabs.Panel value="custom">
                <CustomFilters setChosenSeeds={setChosenSeeds} />
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
              checked={anyTempo}
              label="Include doubled BPM"
              onChange={(event) => {
                const isChecked = event.currentTarget.checked;
                setAnyTempo(isChecked);
              }}
            />
            <Checkbox
              checked={anyTempo}
              label="Include halved BPM"
              onChange={(event) => {
                const isChecked = event.currentTarget.checked;
                setAnyTempo(isChecked);
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
        <Accordion.Item value="Advanced">
          <Accordion.Control>Advanced</Accordion.Control>
          <Accordion.Panel>
            <Select
              key={form.key("key")}
              {...form.getInputProps("key")}
              label="Key"
              data={["Any", "A", "B", "C", "D", "E", "F", "G"]}
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
