import { showErrorNotif, showSuccessNotif } from "@/helpers/general";
import { savePlaylist } from "@/helpers/playlist";
import { PlaylistData, PlaylistObject } from "@/types/types";
import {
  Button,
  Checkbox,
  Modal,
  Table,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { useRef, useState } from "react";
import Recommendations from "./recommendations";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
} from "@tabler/icons-react";

interface PlaylistProps {
  playlistLen: number;
  setPlaylistLen: React.Dispatch<React.SetStateAction<number>>;
  playlist: PlaylistObject[] | null;
  setPlaylist: React.Dispatch<React.SetStateAction<PlaylistObject[] | null>>;
  recommendations: PlaylistObject[] | null;
  setRecommendations: React.Dispatch<
    React.SetStateAction<PlaylistObject[] | null>
  >;
}

export default function Playlist({
  playlistLen,
  setPlaylistLen,
  playlist,
  setPlaylist,
  recommendations,
  setRecommendations,
}: PlaylistProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string>("");
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const [opened, setOpened] = useState(false);
  const isMobile = useMediaQuery("(max-width: 50em)");
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
    const savedPlaylist = await savePlaylist(playlist, formValues);
    if (savedPlaylist) {
      showSuccessNotif(
        "Playlist saved",
        "Your playlist was successfully saved."
      );
      setOpened(false);
    } else {
      showErrorNotif(
        "Error",
        "Your playlist could not be saved. If the issue persists, please raise an issue on GitHub."
      );
    }
  }

  const addMoreTracks = () => {
    setPlaylistLen((prev) => prev + 10); // Show 10 more tracks each time
  };

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

  function removeFromPlaylist(trackId: string) {
    const updatedPlaylist = playlist?.filter(
      (track) => track.track.id != trackId
    );
    updatedPlaylist && setPlaylist(updatedPlaylist);
  }

  const rows = playlist.slice(0, playlistLen).map((track) => (
    <Table.Tr key={track.track.id}>
      <Table.Td className="centerContent">
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
                <IconPlayerPauseFilled size={16} />
              ) : (
                <IconPlayerPlayFilled size={16} />
              )}
            </button>
          </>
        )}
      </Table.Td>
      <Tooltip.Floating
        multiline
        w={200}
        label={
          <>
            {`Tempo: ${track.features.tempo.toFixed(0)}`} <br />
            {`Energy: ${track.features.energy.toFixed(1)}`} <br />
            {`Acousticness: ${track.features.acousticness.toFixed(1)}`} <br />
            {`Instrumentalness: ${track.features.instrumentalness.toFixed(1)}`}
            <br />
            {`Danceability: ${track.features.danceability.toFixed(1)}`} <br />
            {`Liveness: ${track.features.liveness.toFixed(1)}`} <br />
            {`Loudness: ${track.features.loudness.toFixed(1)}`} <br />
            {`Mode: ${track.features.mode.toFixed(1)}`} <br />
            {`Speechiness: ${track.features.speechiness.toFixed(1)}`} <br />
            {`Time signature: ${track.features.time_signature.toFixed(1)}`}
          </>
        }
      >
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
      </Tooltip.Floating>
      <Table.Td>
        <a href={track.track.album.external_urls.spotify}>
          {track.track.album.name}
        </a>
      </Table.Td>
      <Table.Td>{"<3"}</Table.Td>
      <Table.Td>
        <Button onClick={() => removeFromPlaylist(track.track.id)}>-</Button>
      </Table.Td>
      <Table.Td>Pin</Table.Td>
    </Table.Tr>
  ));

  return (
    <div className="playlist-container">
      <h2>Results</h2>
      <Table horizontalSpacing="xs" verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: "5%" }}>Preview</Table.Th>
            <Table.Th style={{ width: "40%" }}>Title</Table.Th>
            <Table.Th style={{ width: "40%" }}>Album</Table.Th>
            <Table.Th style={{ width: "5%" }}></Table.Th>
            <Table.Th style={{ width: "5%" }}>Remove</Table.Th>
            <Table.Th style={{ width: "5%" }}>Pin</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      {playlistLen < playlist.length && (
        <Button onClick={addMoreTracks}>Show More</Button>
      )}
      <Modal.Root
        opened={opened}
        onClose={() => setOpened(false)}
        fullScreen={isMobile}
        centered
      >
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>Save Playlist</Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <form
              className="playlist"
              onSubmit={form.onSubmit((values) =>
                handleSubmit(values, playlist)
              )}
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
              <Checkbox
                label="Public"
                key={form.key("public")}
                {...form.getInputProps("public", { type: "checkbox" })}
              />
              <Button type="submit">Save playlist</Button>
            </form>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
      <Button type="button" onClick={() => setOpened(true)}>
        Save as playlist
      </Button>

      {recommendations && (
        <Recommendations
          recommendations={recommendations}
          playlist={playlist}
          setPlaylist={setPlaylist}
          setRecommendations={setRecommendations}
        />
      )}
    </div>
  );
}
