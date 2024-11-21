import { checkSavedTracks } from "@/helpers/fetchers";
import { syncSpotifyAndIdb } from "@/helpers/general";
import { filterDatabase, getRecommendations } from "@/helpers/playlist";
import { FormValues, TrackObject, User } from "@/types/types";
import {
  Accordion,
  Button,
  Checkbox,
  CheckIcon,
  Group,
  NumberInput,
  Radio,
  Select,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import LoadingPlaylist from "./loadingPlaylist";
import Playlist from "./playlist";

interface FormProps {
  user: User | null;
  storeMyData: () => void;
  libraryStored: boolean;
}

export default function Form({ user, storeMyData, libraryStored }: FormProps) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      minTempo: 165,
      maxTempo: 180,
      targetValence: "Any",
      targetDanceability: "Any",
      targetEnergy: "Any",
      targetInstrumentalness: "Any",
      targetAcousticness: "Any",
      source: "1",
      target: 10,
    },
  });
  const [numResults, setNumResults] = useState(0);
  const [playlist, setPlaylist] = useState<Map<string, TrackObject> | null>(
    null
  );
  const [matchingTracks, setMatchingTracks] = useState<Map<
    string,
    TrackObject
  > | null>(null);
  const [recommendations, setRecommendations] = useState<Map<
    string,
    TrackObject
  > | null>(null);
  const [targetPlaylistLength, setTargetPlaylistLength] = useState<number>(0);
  const [loadingPlaylist, setLoadingPlaylist] = useState<boolean>(false);
  const [anyTempo, setAnyTempo] = useState<boolean>(false);

  async function handleSubmit(values: FormValues, anyTempo: boolean) {
    // Mark playlist as loading so that loadingPlaylist component is displayed
    setLoadingPlaylist(true);

    // Search for matching tracks
    const matchingTracks: Map<string, TrackObject> | null =
      await filterDatabase(values, anyTempo);
    if (!matchingTracks) {
      console.log("Could not find matching tracks");
      return;
    }

    // Check if matching tracks are saved in Spotify library
    const syncedSpotifySaveStatusTracks: Map<string, TrackObject> | null =
      await checkSavedTracks(matchingTracks);
    if (!syncedSpotifySaveStatusTracks) return;

    // For each matching track, sync IDB saved tracks library with the Spotify saved status
    // E.g. if one track is marked as unsaved in spotify but is saved in IDB, remove it from IDB
    for (const trackObject of matchingTracks.values()) {
      syncSpotifyAndIdb(trackObject, trackObject.saved); // Adds or removes track from IDB depending on Spotify saved status
    }

    // Create newPlaylist which will store the tracks that will be part of the playlist
    let newPlaylist: Map<string, TrackObject> = new Map();
    // If there are tracks in the current playlist, find tracks user has "pinned" and add them to the newPlaylist
    // If value.pinned === true for each value in current playlist, add to newPlaylistMap
    if (playlist) {
      for (const [key, value] of playlist.entries()) {
        if (value.pinned === true) {
          newPlaylist.set(key, value);
          console.log("adding pinned track to new playlist:", value);
        }
      }
    }

    setTargetPlaylistLength(values.target); // tracks the initial number of matching tracks to add to the playlist
    setNumResults(matchingTracks.size); // track number of results so we can tell user how many matches there were

    // Set new playlist with pinned tracks + matching tracks <= targetPlaylistLength
    if (newPlaylist.size < values.target) {
      const missingNumber: number = values.target - newPlaylist.size;

      // Remove any tracks from matchingTracks that are already pinned in the playlist
      for (const key of matchingTracks.keys()) {
        if (playlist?.get(key)) {
          if (playlist.get(key)?.pinned) {
            matchingTracks.delete(key);
          }
        }
      }

      // If the user is searching based on Saved Songs, remove any tracks from matchingTracks that are marked as unsaved
      // (They would have originally been found in library, but if they were unsaved in Spotify, IDB is synced as above but the track also needs to be removed from the playlist)
      if (values.source === "2") {
        console.log("values.source === 2");
        for (const key of matchingTracks.keys()) {
          if (playlist?.get(key)) {
            if (!playlist.get(key)?.saved) {
              console.log("track marked as not saved in spotify, removing");
              matchingTracks.delete(key);
            }
          }
        }
      }

      // Slice matchingTracks to be the size of missingNumber, then add to newPlaylist
      const tempArray = Array.from(matchingTracks).slice(0, missingNumber);

      const newMap = new Map(tempArray);

      // Remove the matching tracks being added to the newPlaylist from matchingTracks
      for (const key of newMap.keys()) {
        matchingTracks.delete(key);
      }

      newPlaylist = new Map([...newPlaylist, ...newMap]);
    }

    // setLoadingPlaylist(false);
    setPlaylist(newPlaylist);
    setMatchingTracks(matchingTracks);

    // Fetch 100 recs (only the first five will be displayed in the Recommendations component)
    const recs: Map<string, TrackObject> | null = await getRecommendations(
      values,
      anyTempo,
      100
    );
    if (recs) {
      // Loop through recs items, checking if already in playlist
      for (const key of recs.keys()) {
        if (playlist?.get(key)) {
          console.log(`${key} track already in playlist`);
          recs.delete(key);
        }
      }
      setRecommendations(recs);
    }
  }

  async function handleRefreshRecs() {
    let updatedRecs = new Map(recommendations); // Copy current state to avoid mutating
    const tempArray = Array.from(updatedRecs).slice(4, -1); // Remove first 5 tracks from current recs
    updatedRecs = new Map(tempArray); // Add newly sliced recs to map

    let newlyFetchedRecs: Map<string, TrackObject> | null; // Initialise Map to store newly fetched recs

    // Fetch new recs if updatedRecs <=5
    if (updatedRecs.size <= 5) {
      console.log("Fetching 100 more recs");
      // fetch and add new recs
      newlyFetchedRecs = await getRecommendations(form.values, anyTempo, 100);
      if (!newlyFetchedRecs) return;

      // Loop through recs items, removing tracks that are already in playlist
      for (const key of newlyFetchedRecs.keys()) {
        if (playlist?.get(key)) {
          newlyFetchedRecs.delete(key);
        }
      }
      // TODO: If newly fetched recs <= 5, try new seeds and get more
      const finalisedRecs = new Map([...updatedRecs, ...newlyFetchedRecs]);

      setRecommendations(finalisedRecs);
    } else {
      setRecommendations(updatedRecs);
    }
  }

  // Adds a recommendation to the playlist, and checks if this makes recs.size < 5, if so, fetches more recs
  async function addRecToPlaylist(track: TrackObject) {
    setPlaylist((prevPlaylist) => {
      const newPlaylist = new Map(prevPlaylist);
      newPlaylist.set(track.track.id, track);
      return newPlaylist;
    }); // add track to playlist

    setRecommendations((prevRecs) => {
      const newRecs = new Map(prevRecs);
      newRecs.delete(track.track.id);
      return newRecs;
    }); // rm track from recs

    // If recs.length <= 5, fetch new recs and add to recs
    // Spotify will return the same recs as before. TODO: Update fetchRecs() to create variety in recs
    if (recommendations && recommendations.size <= 5) {
      const recs: Map<string, TrackObject> | null = await getRecommendations(
        form.values,
        anyTempo,
        5
      );
      if (!recs) return;

      // Loop through recsMap items, checking if already in playlist
      for (const key of recs.keys()) {
        if (playlist?.get(key) || recommendations.get(key)) {
          console.log(`${key} track already in playlist or recommended`);
          recs.delete(key);
        }
      }

      // TODO: If recsMap 0 or low due to filter restraints, fetch more with new set of artists/tracks/genres?

      setRecommendations((prevRecs) => {
        // Init newRecs Map for adding newRecs to prevRecs
        const newRecs = new Map([...(prevRecs ?? []), ...recs]); // prevRecs as [] if there are no prevRecs
        return newRecs;
      });
    }
  }

  return (
    <div className="main">
      <form
        className="playlistForm"
        onSubmit={form.onSubmit((values) => handleSubmit(values, anyTempo))}
        onReset={form.onReset}
      >
        <h2 id="filters">Filters</h2>
        <Accordion defaultValue="Tracks Source">
          <Accordion.Item value="Tracks Source">
            <Accordion.Control>Tracks Source</Accordion.Control>
            <Accordion.Panel>
              <Radio.Group
                name="source"
                label="Source"
                {...form.getInputProps("source")}
              >
                <Group
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                  }}
                >
                  <Radio value={"1"} icon={CheckIcon} label="Custom" />
                  {!libraryStored ? (
                    <Button onClick={storeMyData} style={{ maxWidth: "100%" }}>
                      Fetch Spotify data to access personalised playlist
                      features.
                    </Button>
                  ) : (
                    <>
                      <Tooltip.Floating
                        multiline
                        w={200}
                        label={"Filters from your Spotify Saved Tracks."}
                      >
                        <Radio
                          className="sourceFilterRadio"
                          value={"2"}
                          icon={CheckIcon}
                          // disabled={!user || !libraryStored}
                          label="Saved Songs"
                        />
                      </Tooltip.Floating>
                      <Radio
                        value={"3"}
                        // disabled={!user || !libraryStored}
                        icon={CheckIcon}
                        label="Top Tracks"
                      />
                      <Radio
                        value={"4"}
                        // disabled={!user || !libraryStored}
                        icon={CheckIcon}
                        label="Recommendations"
                      />
                    </>
                  )}
                </Group>
              </Radio.Group>
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
              <div className="bpm">
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
              <Tooltip
                multiline
                w={220}
                label="Advanced filters are subjective and may limit results more than desired."
                events={{ hover: true, focus: true, touch: false }}
                position="right"
              >
                <IconInfoCircle
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  size={22}
                  stroke={2}
                />
              </Tooltip>
              {[
                "Valence",
                "Danceability",
                "Energy",
                "Instrumentalness",
                "Acousticness",
              ].map((filter: string) => (
                <Select
                  key={form.key(`target` + filter)}
                  {...form.getInputProps(`target` + filter)}
                  label={filter}
                  data={["Any", "Low", "Medium", "High"]}
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
      {loadingPlaylist && <LoadingPlaylist />}
      {!loadingPlaylist && playlist && (
        <Playlist
          setMatchingTracks={setMatchingTracks}
          matchingTracks={matchingTracks}
          playlist={playlist}
          setPlaylist={setPlaylist}
          recommendations={recommendations}
          setRecommendations={setRecommendations}
          addRecToPlaylist={addRecToPlaylist}
          handleRefreshRecs={handleRefreshRecs}
        />
      )}
      {!loadingPlaylist &&
        !playlist &&
        "Please submit your preferences to generate a playlist."}
    </div>
  );
}
