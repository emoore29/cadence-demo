import { checkSavedTracks } from "@/helpers/fetchers";
import { syncSpotifyAndIdb } from "@/helpers/general";
import { filterDatabase, getRecommendations } from "@/helpers/playlist";
import { FormValues, Track, TrackObject } from "@/types/types";
import { Button, Group, NumberInput, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import Playlist from "./playlist";

export default function Form() {
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
      source: "My Saved Songs",
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

    // Check if tracks are saved in Spotify library
    const syncedSpotifySaveStatusTracks: Map<string, TrackObject> | null =
      await checkSavedTracks(matchingTracks);
    if (!syncedSpotifySaveStatusTracks) return;

    // For each matching track, sync IDB saved tracks library with the Spotify saved status
    // E.g. if one track is marked as saved in spotify but not saved in IDB, add it to IDB
    for (const trackObject of matchingTracks.values()) {
      syncSpotifyAndIdb(trackObject, trackObject.saved!); // Adds or removes track from IDB depending on Spotify saved status
    }

    // Add matching tracks to matchingTracks state
    setMatchingTracks(matchingTracks);
    console.log("matching tracks:", matchingTracks);

    // Create newPlaylist which will store the tracks that will be part of the playlist
    let newPlaylist = new Map();
    console.log("playlist", playlist);
    // If there are tracks in the current playlist, find tracks user has "pinned" and add them to the newPlaylist
    // If value.pinned === true for each value in current playlist, add to newPlaylistMap
    if (playlist) {
      for (const [key, value] of Object.entries(playlist)) {
        if (value.pinned === true) {
          newPlaylist.set(key, value);
        }
      }
    }
    console.log("newPlaylist before adding matching tracks", newPlaylist);

    setTargetPlaylistLength(values.target); // tracks the initial number of matching tracks to add to the playlist
    setNumResults(totalMatches); // track number of results so we can tell user how many matches there were

    // Set new playlist with pinned tracks + matching tracks <= targetPlaylistLength
    if (newPlaylist.size < targetPlaylistLength) {
      const missingNumber: number = targetPlaylistLength - newPlaylist.size;
      // Slice matchingTracks to be the size of missingNumber, then add to newPlaylist
      const tempArray = Array.from(matchingTracks).slice(0, missingNumber);
      const newMap = new Map(tempArray);
      newPlaylist = new Map([...newPlaylist, ...newMap]);
    }

    console.log(
      "new playlist after adding pinned and matching tracks:",
      newPlaylist
    );

    setPlaylist(newPlaylist);

    // Display 5 recommendations
    // Fetch 100, but display 5, adding new ones every time a recommendation is added
    // Display the next 5 if user clicks refresh
    const recs: [number, Map<string, TrackObject>] | null =
      await getRecommendations(values, 2);
    if (recs) {
      // const sampleRecs = shuffleAndSlice(recs[1], 5);
      setRecommendations(recs[1]);
    }
  }

  // Adds a recommendation to the playlist, and checks if this makes recs.size < 5, if so, fetches more recs
  async function addRecToPlaylist(track: TrackObject) {
    console.log(
      "Adding track to playlist. Recommendations currently:",
      recommendations
    );
    setPlaylist((prevPlaylist) => prevPlaylist.set(track.track.id, track)); // add track to playlist
    setRecommendations((prevRecs) => prevRecs.delete(track.track.id)); // rm track from recs

    // If recs.length < 5, fetch a new rec and add to recs
    // Access form.values directly to use the current form values
    if (recommendations && recommendations.size <= 5) {
      console.log("recommendation length < 5:", recommendations);
      const recs: [number, Map<string, TrackObject>] | null =
        await getRecommendations(
          form.values, // Pass the current form values here
          2
        );
      if (!recs) return;
      setRecommendations((recommendations) => [
        ...recommendations!,
        ...recs[1],
      ]);
    }
  }

  return (
    <div className="main">
      <form className="playlist-form" onSubmit={form.onSubmit(handleSubmit)}>
        <h2>Filters</h2>
        <Select
          variant="filled"
          key={form.key("source")}
          {...form.getInputProps("source")}
          label={"Source"}
          data={["My Saved Songs", "My Top Tracks", "Get Recommendations"]}
          allowDeselect={false}
        />
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
          />
          <NumberInput
            label="Max BPM"
            key={form.key("maxTempo")}
            description="<=300"
            placeholder="Input placeholder"
            {...form.getInputProps("maxTempo")}
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
            variant="filled"
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
        {numResults ? <p>There were {numResults} results.</p> : ""}
      </form>
      {playlist ? (
        <Playlist
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
