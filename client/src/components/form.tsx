import { filterDatabase } from "@/helpers/playlist";
import { FormValues, PlaylistObject } from "@/types/types";
import {
  Button,
  NumberInput,
  Slider,
  Text,
  Checkbox,
  Radio,
  Group,
  RangeSlider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import Playlist from "./playlist";

export default function Form() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      minBpm: 165,
      maxBpm: 180,
      valence: 0.5,
      danceability: 0.5,
      energy: 0.5,
      instrumental: false,
      acoustic: false,
      source: "library",
    },
  });

  const [playlist, setPlaylist] = useState<PlaylistObject[] | null>(null);

  async function handleSubmit(values: FormValues) {
    console.log("Filtering:", values);
    const result: PlaylistObject[] | null = await filterDatabase(values);
    if (result) {
      console.log("Setting new playlist...");
      setPlaylist(result);
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
            <Radio value="library" label="My Saved Songs" />
            <Radio value="topTracks" label="My Top Tracks" />
            <Radio value="recommendations" label="Get recommendations" />
          </Group>
        </Radio.Group>
        <div className="bpm">
          <NumberInput
            label="Min BPM"
            key={form.key("minBpm")}
            description=">=30"
            placeholder="Input placeholder"
            {...form.getInputProps("minBpm")}
          />
          <NumberInput
            label="Max BPM"
            key={form.key("maxBPM")}
            description="<=300"
            placeholder="Input placeholder"
            {...form.getInputProps("maxBpm")}
          />
        </div>

        <Text>Energy</Text>
        <Slider
          label={null}
          min={0}
          max={1}
          defaultValue={0.5}
          step={0.001}
          marks={[
            { value: 0, label: "0%" },
            { value: 1, label: "100%" },
          ]}
          key={form.key("energy")}
          {...form.getInputProps("energy")}
        />

        {/* <Text>Mood</Text>
        <Slider
          label={null}
          min={0}
          max={1}
          defaultValue={0.5}
          step={0.001}
          marks={[
            { value: 0, label: "Low" },
            { value: 1, label: "High" },
          ]}
          key={form.key("valence")}
          {...form.getInputProps("valence")}
        />
        <Text>Danceability</Text>
        <Slider
          label={null}
          min={0}
          max={1}
          defaultValue={0.5}
          step={0.001}
          marks={[
            { value: 0, label: "0%" },
            { value: 1, label: "100%" },
          ]}
          key={form.key("danceability")}
          {...form.getInputProps("danceability")}
        /> */}
        <Checkbox
          label="Instrumental"
          key={form.key("instrumental")}
          {...form.getInputProps("instrumental", { type: "checkbox" })}
        />
        <Checkbox
          label="Acoustic"
          key={form.key("acoustic")}
          {...form.getInputProps("acoustic", { type: "checkbox" })}
        />
        <Group justify="flex-end" mt="md">
          <Button type="submit">Submit</Button>
        </Group>
      </form>
      {playlist && <Playlist playlist={playlist} />}
    </div>
  );
}
