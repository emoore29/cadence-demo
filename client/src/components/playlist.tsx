import { savePlaylist } from "@/helpers/playlist";
import { PlaylistData, PlaylistObject } from "@/types/types";
import { Checkbox, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

interface PlaylistProps {
  playlist: PlaylistObject[] | null;
}

export default function Playlist({ playlist }: PlaylistProps) {
  if (!playlist) return <div>No playlist available</div>;
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      name: "Cadence playlist",
      description: "Cadence playlist description",
      public: true,
    },
  });

  async function handleSubmit(
    formValues: PlaylistData,
    playlist: PlaylistObject[] | null
  ) {
    await savePlaylist(playlist, formValues);
  }

  return (
    <form
      className="playlist"
      onSubmit={form.onSubmit((values) => handleSubmit(values, playlist))}
    >
      <TextInput
        label="Playlist Name"
        placeholder="Cadence: Playlist Name"
        key={form.key("name")}
        {...form.getInputProps("name")}
        styles={{
          input: {
            backgroundColor: "rgb(126, 74, 101)",
            color: "rgba(255, 255, 255, 0.87)",
            borderColor: "rgba(255, 255, 255, 0.3)",
          },
          label: {
            color: "rgba(255, 255, 255, 0.87)",
          },
        }}
      />
      <TextInput
        label="Playlist Description"
        placeholder="Playlist generated with cadence"
        key={form.key("description")}
        {...form.getInputProps("description")}
        styles={{
          input: {
            backgroundColor: "rgb(126, 74, 101)",
            color: "rgba(255, 255, 255, 0.87)",
            borderColor: "rgba(255, 255, 255, 0.3)",
          },
          label: {
            color: "rgba(255, 255, 255, 0.87)",
          },
        }}
      />
      {playlist &&
        playlist.map((track: PlaylistObject) => {
          return (
            <div key={track.track.id}>
              <a href={track.track.external_urls.spotify}>
                {track.track.name}, {track.track.artists[0].name}, Tempo:{" "}
                {track.features.tempo.toFixed(0)}, Instrumentalness:{" "}
                {track.features.instrumentalness.toFixed(1)}, Acousticness:{" "}
                {track.features.acousticness.toFixed(1)}
              </a>

              <br />
            </div>
          );
        })}

      <Checkbox
        label="Public"
        key={form.key("public")}
        {...form.getInputProps("public", { type: "checkbox" })}
      />

      <button type="submit">Save playlist</button>
    </form>
  );
}
