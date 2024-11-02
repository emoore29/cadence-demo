import { filterDatabase } from "@/helpers/playlist";
import { FormValues, PlaylistObject } from "@/types/types";
import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  Radio,
  Slider,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import Playlist from "./playlist";

export default function Form() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      minTempo: 165,
      maxTempo: 180,
      targetValence: 0.5,
      targetDanceability: 0.5,
      targetEnergy: 0.5,
      targetInstrumentalness: 0.5,
      targetAcousticness: 0.5,
      source: "1",
      target: 15,
    },
  });
  const [total, setTotal] = useState(0);
  const [playlist, setPlaylist] = useState<PlaylistObject[] | null>(null);
  // const [isDisabled, setIsDisabled] = useState(true);

  async function handleSubmit(values: FormValues) {
    console.log("Filtering:", values);
    const result: [number, PlaylistObject[]] | null = await filterDatabase(
      values
    );
    if (result) {
      setTotal(result[0]);
      setPlaylist(result[1]);
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
        <NumberInput
          label="Target number of tracks"
          key={form.key("target")}
          placeholder="20"
          {...form.getInputProps("target")}
        />
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
          key={form.key("targetEnergy")}
          {...form.getInputProps("targetEnergy")}
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
        {total && (
          <div>
            <p>There were {total} results.</p>
            <Button type="button">Show all</Button>
            <Button type="button">Shuffle</Button>
          </div>
        )}
      </form>
      {playlist ? (
        <Playlist playlist={playlist} />
      ) : (
        "Please submit your preferences to generate a playlist."
      )}
    </div>
  );
}
