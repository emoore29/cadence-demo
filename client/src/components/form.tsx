import { Track } from "@/types/types";
import { useState } from "react";
import Playlist from "./playlist";
import { useForm } from "@mantine/form";
import { Button, Checkbox, Group, TextInput, NumberInput } from "@mantine/core";

export default function Form() {
  // const [bpm, setBPM] = useState<[string, string]>(["95", "165"]);
  // const [filterFrom, setFilterFrom] = useState("1");
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      minBPM: 30,
      maxBPM: 300,
      privatePlaylist: false,
    },

    // validate: {
    //   email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    // },
  });

  const [playlist, setPlaylist] = useState<Track[] | null>(null);
  const [filters, setFilters] = useState();

  // advanced filters:
  // valence (mood) slider 0-1
  // danceability 0-1 slider
  // energy: 0-1 (1 = high energy) - slider
  // instrumentalness 0-1 (1 = no vocals) - checkbox? and then if yes, filter 0.5-1, if no, filter 0-0.5?
  // mode (major/minor) - 0 or 1, (0 = minor, 1 = major)
  // time signature: 3-7 (3/4 - 7/4)

  return (
    <>
      <form
        className="playlist-form"
        onSubmit={form.onSubmit((values) => console.log(values))}
      >
        <NumberInput
          label="Min BPM"
          key={form.key("minBPM")}
          description=">=30"
          placeholder="Input placeholder"
        />
        <NumberInput
          label="Max BPM"
          key={form.key("maxBPM")}
          description="<=300"
          placeholder="Input placeholder"
        />
        <Checkbox
          mt="md"
          label="Private"
          key={form.key("privatePlaylist")}
          {...form.getInputProps("privatePlaylist", { type: "checkbox" })}
        />

        <Group justify="flex-end" mt="md">
          <Button type="submit">Submit</Button>
        </Group>
      </form>
      {playlist && <Playlist playlist={playlist} />}
    </>
  );
}
