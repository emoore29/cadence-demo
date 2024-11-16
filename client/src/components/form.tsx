import { checkSavedTracks } from "@/helpers/fetchers";
import { syncSpotifyAndIdb } from "@/helpers/general";
import { filterDatabase, getRecommendations } from "@/helpers/playlist";
import { FormValues, Track, TrackObject } from "@/types/types";
import {
  Button,
  Group,
  NumberInput,
  Select,
  useMantineTheme,
  Radio,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import Playlist from "./playlist";

export default function Form() {
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
    const matchingTracksResult: [number, Map<string, TrackObject>] | null =
      await filterDatabase(values);
    if (!matchingTracksResult) {
      console.log("Could not find matching tracks");
      return;
    }

    const [totalMatches, matchingTracks] = matchingTracksResult;

    console.log("Original matching tracks size:", matchingTracks.size);

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
    setNumResults(totalMatches); // track number of results so we can tell user how many matches there were

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

    console.log(
      "After removing duplicates and adding matches to playlist: matching tracks size:",
      matchingTracks.size
    );

    setPlaylist(newPlaylist);
    setMatchingTracks(matchingTracks);

    // Fetch 100 recs, but display 5
    // Display the next 5 if user clicks refresh
    const recs: [number, Map<string, TrackObject>] | null =
      await getRecommendations(values, 5);
    if (recs) {
      // const sampleRecs = shuffleAndSlice(recs[1], 5);

      const [numRecs, recsMap] = recs;

      // Loop through recsMap items, checking if already in playlist
      for (const key of recsMap.keys()) {
        if (playlist?.get(key)) {
          console.log(`${key} track already in playlist`);
          recsMap.delete(key);
        }
      }
      setRecommendations(recsMap);
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
      const recs: [number, Map<string, TrackObject>] | null =
        await getRecommendations(form.values, 5);
      if (!recs) return;

      // TODO: Check recs for tracks that are already in playlist, and remove them if so
      const [numRecs, recsMap] = recs;

      // Loop through recsMap items, checking if already in playlist
      for (const key of recsMap.keys()) {
        if (playlist?.get(key) || recommendations.get(key)) {
          console.log(`${key} track already in playlist or recommended`);
          recsMap.delete(key);
        }
      }

      // TODO: If recsMap 0 or low due to filter restraints, fetch more with new set of artists/tracks/genres?

      setRecommendations((prevRecs) => {
        // Init newRecs Map for adding newRecs to prevRecs
        const newRecs = new Map([...(prevRecs ?? []), ...recsMap]); // prevRecs as [] if there are no prevRecs
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
              <Radio value={"1"} label="My Saved Songs" />
            </Tooltip.Floating>
            <Radio value={"2"} label="My Top Tracks" />
            <Radio value={"3"} label="Recommendations" />
          </Group>
        </Radio.Group>
        {/* <Select
          variant="filled"
          key={form.key("source")}
          {...form.getInputProps("source")}
          label={"Source"}
          data={["My Saved Songs", "My Top Tracks", "Get Recommendations"]}
          allowDeselect={false}
        /> */}
        <NumberInput
          label="Target number of tracks"
          key={form.key("target")}
          placeholder="20"
          {...form.getInputProps("target")}
        />
        <div className="bpm">
          <NumberInput
            label="Min BPM"
            key={form.key("minTempo")}
            description=">=30"
            placeholder="Input placeholder"
            {...form.getInputProps("minTempo")}
            stepHoldDelay={500}
            stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
          />
          <NumberInput
            label="Max BPM"
            key={form.key("maxTempo")}
            description="<=300"
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
          <Button type="submit">Submit</Button>
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
        />
      ) : (
        "Please submit your preferences to generate a playlist."
      )}
    </div>
  );
}
