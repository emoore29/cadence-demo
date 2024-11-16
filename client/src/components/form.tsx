import { checkSavedTracks } from "@/helpers/fetchers";
import { syncSpotifyAndIdb } from "@/helpers/general";
import { filterDatabase, getRecommendations } from "@/helpers/playlist";
import { FormValues, TrackObject, User } from "@/types/types";
import {
  Button,
  Group,
  NumberInput,
  Radio,
  Select,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import Playlist from "./playlist";

interface FormProps {
  user: User | null;
}

export default function Form({ user }: FormProps) {
  const theme = useMantineTheme();
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

  async function handleSubmit(values: FormValues) {
    const matchingTracks: Map<string, TrackObject> | null =
      await filterDatabase(values);
    if (!matchingTracks) {
      console.log("Could not find matching tracks");
      return;
    }

    // Check if tracks are saved in Spotify library
    const syncedSpotifySaveStatusTracks: Map<string, TrackObject> | null =
      await checkSavedTracks(matchingTracks);
    if (!syncedSpotifySaveStatusTracks) return;

    // For each matching track, sync IDB saved tracks library with the Spotify saved status
    // E.g. if one track is marked as saved in spotify but not saved in IDB, add it to IDB
    for (const trackObject of matchingTracks.values()) {
      syncSpotifyAndIdb(trackObject, trackObject.saved!); // Adds or removes track from IDB depending on Spotify saved status
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

      // Remove any tracks from matchingTracks that are already in the playlist (pinned)
      for (const key of matchingTracks.keys()) {
        if (playlist?.get(key)) {
          console.log(`${key} track already in playlist`);
          matchingTracks.delete(key);
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

    setPlaylist(newPlaylist);
    setMatchingTracks(matchingTracks);

    // Fetch 100 recs (only the first five will be displayed in the Recommendations component)
    const recs: Map<string, TrackObject> | null = await getRecommendations(
      values,
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
      newlyFetchedRecs = await getRecommendations(form.values, 100);
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
      <form className="playlist-form" onSubmit={form.onSubmit(handleSubmit)}>
        <h2>Filters</h2>
        <Radio.Group
          name="source"
          label="Source"
          {...form.getInputProps("source")}
        >
          <Group mt="xs">
            <Tooltip.Floating
              multiline
              w={200}
              label={"Filters from your Spotify Saved Tracks."}
            >
              <Radio value={"1"} disabled={!user} label="My Saved Songs" />
            </Tooltip.Floating>
            <Radio value={"2"} disabled={!user} label="My Top Tracks" />
            <Radio value={"3"} label="Recommendations" />
          </Group>
        </Radio.Group>
        <NumberInput
          label="Target number of tracks"
          key={form.key("target")}
          placeholder="20"
          {...form.getInputProps("target")}
          stepHoldDelay={500}
          stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
        />
        <div className="bpm">
          <NumberInput
            label="Min BPM"
            key={form.key("minTempo")}
            placeholder="Input placeholder"
            {...form.getInputProps("minTempo")}
            stepHoldDelay={500}
            stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
          />
          <NumberInput
            label="Max BPM"
            key={form.key("maxTempo")}
            placeholder="Input placeholder"
            {...form.getInputProps("maxTempo")}
            stepHoldDelay={500}
            stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
          />
        </div>
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
        <Group justify="flex-end" mt="md">
          <Button
            color="rgba(255, 255, 255, 0.8)"
            variant="outline"
            type="submit"
          >
            Submit
          </Button>
        </Group>
      </form>
      {playlist ? (
        <Playlist
          setMatchingTracks={setMatchingTracks}
          matchingTracks={matchingTracks}
          targetPlaylistLength={targetPlaylistLength}
          setTargetPlaylistLength={setTargetPlaylistLength}
          playlist={playlist}
          setPlaylist={setPlaylist}
          recommendations={recommendations}
          setRecommendations={setRecommendations}
          addRecToPlaylist={addRecToPlaylist}
          handleRefreshRecs={handleRefreshRecs}
        />
      ) : (
        "Please submit your preferences to generate a playlist."
      )}
    </div>
  );
}
