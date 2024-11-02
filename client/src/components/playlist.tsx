import { savePlaylist } from "@/helpers/playlist";
import { PlaylistData, PlaylistObject } from "@/types/types";
import { Checkbox, TextInput, Table } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRef, useState } from "react";

interface PlaylistProps {
  playlist: PlaylistObject[] | null;
}

export default function Playlist({ playlist }: PlaylistProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string>("");
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

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

  const playSampleTrack = (trackId: string) => {
    const audioElement = audioRefs.current[trackId];
    if (!audioElement) return; // Early return if no audio element found

    if (audioElement.paused) {
      // Pause any other playing audio
      if (playingTrackId && playingTrackId !== trackId) {
        audioRefs.current[playingTrackId]?.pause();
      }

      audioElement.play();
      setPlayingTrackId(trackId);
    } else {
      audioElement.pause();
      setPlayingTrackId("");
    }
  };

  const rows = playlist!.map((track) => (
    <Table.Tr key={track.track.id}>
      <Table.Td>
        {track.track.preview_url && (
          <>
            <audio
              ref={(el) => (audioRefs.current[track.track.id] = el)}
              id={`audio-${track.track.id}`}
            >
              <source src={track.track.preview_url} type="audio/ogg" />
              <source src={track.track.preview_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <button
              type="button"
              id="playPauseButton"
              onClick={() => playSampleTrack(track.track.id)}
            >
              {playingTrackId === track.track.id ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="icon icon-tabler icons-tabler-filled icon-tabler-player-pause"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
                  <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="icon icon-tabler icons-tabler-filled icon-tabler-player-play"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
                </svg>
              )}
            </button>
          </>
        )}
      </Table.Td>
      <Table.Td>
        <div className="track-display">
          <img
            src={track.track.album.images[0].url}
            alt={track.track.album.name}
            className="album-img"
          />
          <div
            className="title-and-artist"
            style={{
              maxWidth: 300, // Limit cell width
            }}
          >
            <a
              className="track-name"
              href={track.track.external_urls.spotify}
              style={{
                whiteSpace: "nowrap", // Prevent wrapping
                overflow: "hidden", // Hide overflow
                textOverflow: "ellipsis", // Add "..." at end of overflowed text
              }}
            >
              {track.track.name}
            </a>
            <a
              className="track-artist"
              href={track.track.artists[0].external_urls.spotify}
            >
              {track.track.artists[0].name}
            </a>
          </div>
        </div>
      </Table.Td>
      <Table.Td>
        <a href={track.track.album.external_urls.spotify}>
          {track.track.album.name}
        </a>
      </Table.Td>
      <Table.Td>{track.features.tempo.toFixed(0)}</Table.Td>
      <Table.Td>{track.features.energy.toFixed(1)}</Table.Td>
      <Table.Td>{track.features.acousticness.toFixed(1)}</Table.Td>
      <Table.Td>{track.features.instrumentalness.toFixed(1)}</Table.Td>
    </Table.Tr>
  ));

  return (
    <form
      className="playlist"
      onSubmit={form.onSubmit((values) => handleSubmit(values, playlist))}
    >
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Preview</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>Album</Table.Th>
            <Table.Th>Tempo</Table.Th>
            <Table.Th>Energy</Table.Th>
            <Table.Th>Acousticness</Table.Th>
            <Table.Th>Instrumentalness</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      {/* {playlist &&
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
        })} */}
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
      <Checkbox
        label="Public"
        key={form.key("public")}
        {...form.getInputProps("public", { type: "checkbox" })}
      />

      <button type="submit">Save playlist</button>
    </form>
  );
}
