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
  const [playlist, setPlaylist] = useState<TrackObject[] | null>(null);
  const [mapPlaylist, setMapPlaylist] = useState<Map<
    string,
    TrackObject
  > | null>(null);
  const [matchingTracks, setMatchingTracks] = useState<Map<
    string,
    TrackObject
  > | null>(null);
  const [recommendations, setRecommendations] = useState<TrackObject[] | null>(
    null
  );
  const [playlistLen, setPlaylistLen] = useState<number>(0);

  async function handleSubmit(values: FormValues) {
    const result: [number, Map<string, TrackObject>] | null =
      await filterDatabase(values);
    if (!result) {
      console.log("Could not find matching tracks");
      return;
    }

    const [totalMatches, matchingTracksMap] = result;

    // Check if tracks are saved in Spotify library
    const tracks: Map<string, TrackObject> | null = await checkSavedTracks(
      matchingTracksMap
    );
    if (!tracks) return;

    const newPlaylistMap = new Map(matchingTracksMap);

    // Sync IDB with Spotify when playlist is generated
    for (const trackObject of matchingTracksMap.values()) {
      syncSpotifyAndIdb(trackObject, trackObject.saved!);
    }

    // Find tracks user has "pinned" in mapPlaylist
    // add to newPlaylistMap
    // in mapPlaylist, does key, value value.pinned == true, if so, add to newPlaylistMap
    for (const [key, value] of newPlaylistMap.entries()) {
      if (value.pinned === true) {
        newPlaylistMap.set(key, value);
      }
    }

    setPlaylistLen(values.target); // for tracking how many tracks to display to the user
    // TODO: Probably need a separate "results" state that stores the results, and the playlist state only stores the target number of tracks
    // Then if the user wants to see more tracks in their playlist and there are more results available to add, add them
    // This way when a user adds a recommended track, it is added to the actual playlist that is displayed and will be visible to the user
    // rather than being added to the bottom of the entire results list, and won't be visible to the user.
    // Also, when the user saves the playlist, we only want to save the actual visible playlist, not all the other results.
    setNumResults(totalMatches);
    // setPlaylist(newPlaylist);
    setMapPlaylist(newPlaylistMap);

    // Display 5 recommendations
    // Fetch 100, but display 5, adding new ones every time a recommendation is added
    // Display the next 5 if user clicks refresh
    const recs: [number, TrackObject[]] | null = await getRecommendations(
      values,
      2
    );
    if (recs) {
      // const sampleRecs = shuffleAndSlice(recs[1], 5);
      setRecommendations(recs[1]);
    }
  }

  // Adds a recommendation to the playlist, and checks if this makes recs.len < 5, if so, fetches more recs
  async function addRecToPlaylist(track: TrackObject) {
    console.log(
      "Adding track to playlist. Recommendations currently:",
      recommendations
    );
    setPlaylist((playlist) => [...playlist!, track]);
    setRecommendations((recommendations) =>
      recommendations
        ? recommendations.filter((recTrack) => recTrack !== track)
        : recommendations
    );

    // If recs.length < 5, fetch a new rec and add to recs
    // Access form.values directly to use the current form values
    if (recommendations && recommendations.length <= 5) {
      console.log("recommendation length < 5:", recommendations);
      const recs: [number, TrackObject[]] | null = await getRecommendations(
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
          playlistLen={playlistLen}
          setPlaylistLen={setPlaylistLen}
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
