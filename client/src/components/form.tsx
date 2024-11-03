import {
  filterDatabase,
  getRecommendations,
  shuffleAndSlice,
} from "@/helpers/playlist";
import { FormValues, PlaylistObject } from "@/types/types";
import { Button, Group, NumberInput, Radio, Select } from "@mantine/core";
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
      source: "1",
      target: 10,
    },
  });
  const [total, setTotal] = useState(0);
  const [playlist, setPlaylist] = useState<PlaylistObject[] | null>(null);
  const [recommendations, setRecommendations] = useState<
    PlaylistObject[] | null
  >(null);

  async function handleSubmit(values: FormValues) {
    console.log("Filtering:", values);
    const result: [number, PlaylistObject[]] | null = await filterDatabase(
      values
    );

    if (result) {
      setTotal(result[0]);
      setPlaylist(result[1]);

      // Handle if result[0] < target number of tracks (values.target)
      // Fetch 5 recommended tracks

      if (result[0] < values.target) {
        const recs: [number, PlaylistObject[]] | null =
          await getRecommendations(values);
        if (recs) {
          const sampleRecs = shuffleAndSlice(recs[1], 5);
          setRecommendations(sampleRecs);
        }
      } else {
        setRecommendations(null);
      }
    } else {
      setPlaylist([]);
    }
  }

  return (
    <div className="main">
      <form className="playlist-form" onSubmit={form.onSubmit(handleSubmit)}>
        <Radio.Group
          name="source"
          label="Where would you like to filter songs from"
          {...form.getInputProps("source")}
        >
          <Group mt="xs">
            <Radio value={"1"} label="My Saved Songs" />
            <Radio value={"2"} label="My Top Tracks" />
            <Radio value={"3"} label="Get recommendations" />
          </Group>
        </Radio.Group>
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

        <Select
          variant="filled"
          key={form.key("targetValence")}
          {...form.getInputProps("targetValence")}
          label="Valence"
          data={["Any", "Low", "Medium", "High"]}
          allowDeselect={false}
        />
        <Select
          variant="filled"
          key={form.key("targetDanceability")}
          {...form.getInputProps("targetDanceability")}
          label="Danceability"
          data={["Any", "Low", "Medium", "High"]}
          allowDeselect={false}
        />

        <Select
          variant="filled"
          key={form.key("targetEnergy")}
          {...form.getInputProps("targetEnergy")}
          label="Energy"
          data={["Any", "Low", "Medium", "High"]}
          allowDeselect={false}
        />
        <Select
          variant="filled"
          key={form.key("targetInstrumentalness")}
          {...form.getInputProps("targetInstrumentalness")}
          label="Instrumentalness"
          data={["Any", "Low", "Medium", "High"]}
          allowDeselect={false}
        />
        <Select
          variant="filled"
          key={form.key("targetAcousticness")}
          {...form.getInputProps("targetAcousticness")}
          label="Acousticness"
          data={["Any", "Low", "Medium", "High"]}
          allowDeselect={false}
        />

        <Group justify="flex-end" mt="md">
          <Button type="submit">Submit</Button>
        </Group>
        {total && (
          <div>
            <p>There were {total} results.</p>
            <Button type="button">Show all</Button>
            <Button type="button">Shuffle</Button>
          </div>
        )}
      </form>
      {playlist ? (
        <Playlist playlist={playlist} recommendations={recommendations} />
      ) : (
        "Please submit your preferences to generate a playlist."
      )}
    </div>
  );
}
