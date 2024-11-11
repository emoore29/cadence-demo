import {
  filterDatabase,
  getRecommendations,
  shuffleAndSlice,
} from "@/helpers/playlist";
import { FormValues, TrackObject } from "@/types/types";
import { Button, Group, NumberInput, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import Playlist from "./playlist";
import { checkSavedTracks } from "@/helpers/fetchers";
import { syncSpotifyAndIdb } from "@/helpers/general";

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

    // Handle if result[0] < target number of tracks (values.target)
    // Fetch 5 recommended tracks
    if (result[0] < values.target) {
      const recs: [number, TrackObject[]] | null = await getRecommendations(
        values
      );
      if (recs) {
        const sampleRecs = shuffleAndSlice(recs[1], 5);
        setRecommendations(sampleRecs);
      }
    } else {
      setRecommendations(null);
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
        />
      ) : (
        "Please submit your preferences to generate a playlist."
      )}
    </div>
  );
}
