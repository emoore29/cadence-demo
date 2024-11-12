import { checkSavedTracks } from "@/helpers/fetchers";
import { syncSpotifyAndIdb } from "@/helpers/general";
import { filterDatabase, getRecommendations } from "@/helpers/playlist";
import { FormValues, TrackObject } from "@/types/types";
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
  const [recommendations, setRecommendations] = useState<TrackObject[] | null>(
    null
  );
  const [playlistLen, setPlaylistLen] = useState<number>(0);

  async function handleSubmit(values: FormValues) {
    console.log("Filtering:", values);
    const result: [number, TrackObject[]] | null = await filterDatabase(values);
    if (!result) {
      setPlaylist([]);
      return;
    }

    // Check if tracks are saved in Spotify library
    const tracks: TrackObject[] | null = await checkSavedTracks(result[1]);
    if (!tracks) return;

    // Sync IDB with Spotify
    for (const track of tracks) {
      syncSpotifyAndIdb(track, track.saved!);
    }

    const pinnedTracks: TrackObject[] | undefined = playlist?.filter(
      (track) => track.pinned && track.pinned === true
    );
    let newPlaylist: TrackObject[] = [];
    if (pinnedTracks) {
      newPlaylist = [...pinnedTracks, ...tracks];
    } else {
      newPlaylist = [...tracks];
    }

    setPlaylistLen(values.target);
    setNumResults(result[0]);
    setPlaylist(newPlaylist);

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
