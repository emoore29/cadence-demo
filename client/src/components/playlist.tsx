import { updateSavedStatus } from "@/helpers/fetchers";
import { showErrorNotif, showSuccessNotif } from "@/helpers/general";
import { savePlaylist } from "@/helpers/playlist";
import { PlaylistData, TrackObject } from "@/types/types";
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
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import Recommendations from "./recommendations";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

interface PlaylistProps {
  playlistLen: number;
  setPlaylistLen: React.Dispatch<React.SetStateAction<number>>;
  playlist: TrackObject[] | null;
  setPlaylist: React.Dispatch<React.SetStateAction<TrackObject[] | null>>;
  recommendations: TrackObject[] | null;
  setRecommendations: React.Dispatch<
    React.SetStateAction<TrackObject[] | null>
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
    playlist: TrackObject[] | null
  ) {
    const savedPlaylist = await savePlaylist(playlist, formValues);
    if (savedPlaylist) {
      showSuccessNotif(
        "Playlist saved",
        "Your playlist was successfully saved."
      );
      setOpened(false);
    } else {
      showErrorNotif("Error", "Your playlist could not be saved.");
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
              className="playPauseButton"
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
      <Table.Td>
        <button
          type="button"
          className="saveTrackBtn"
          onClick={() => handleSaveClick(track.track.id, track.saved!)}
        >
          {track.saved === true ? (
            <IconHeartFilled size={16} />
          ) : (
            <IconHeart stroke={2} size={16} />
          )}
        </button>
      </Table.Td>
      <Table.Td>
        <Button onClick={() => removeFromPlaylist(track.track.id)}>-</Button>
      </Table.Td>
      <Table.Td>Pin</Table.Td>
    </Table.Tr>
  ));

  async function handleSaveClick(trackId: string, saved: boolean) {
    const updateStatus: string | null = await updateSavedStatus(trackId, saved);
    if (!updateStatus) console.log("Failed to update track saved status");
    // Get track to update
    const trackToUpdate = playlist!.filter(
      (track) => track.track.id === trackId
    )[0];
    if (!trackToUpdate) {
      console.error("Could not find track to update.");
      return;
    }

    // Find and update track directly in playlist
    const updatedPlaylist = playlist!.map((track) => {
      if (track.track.id === trackId) {
        return {
          ...track,
          saved: updateStatus === "Added" ? true : false,
        };
      }
      return track;
    });

    setPlaylist(updatedPlaylist); // Update playlist state with modified array
  }

  return (
    <div className="playlist-container">
      <h2>Results</h2>
      <Table highlightOnHover horizontalSpacing="xs" verticalSpacing="xs">
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
              />
              <TextInput
                label="Playlist Description"
                placeholder="Playlist generated with cadence"
                key={form.key("description")}
                {...form.getInputProps("description")}
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
          handleSaveClick={handleSaveClick}
        />
      )}
    </div>
  );
}
