import { updateSavedStatus } from "@/helpers/fetchers";
import { showErrorNotif, showSuccessNotif } from "@/helpers/general";
import { savePlaylist } from "@/helpers/playlist";
import { PlaylistData, TrackObject } from "@/types/types";
import { Button, Checkbox, Modal, Table, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { IconCircleMinus, IconPin, IconPinFilled } from "@tabler/icons-react";
import { useRef, useState } from "react";
import Recommendations from "./recommendations";
import TrackRow from "./trackRow";

interface PlaylistProps {
  targetPlaylistLength: number;
  setTargetPlaylistLength: React.Dispatch<React.SetStateAction<number>>;
  playlist: Map<string, TrackObject> | null;
  setPlaylist: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject> | null>
  >;
  recommendations: Map<string, TrackObject> | null;
  setRecommendations: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject> | null>
  >;
  addRecToPlaylist: (track: TrackObject) => void;
}

export default function Playlist({
  targetPlaylistLength,
  setTargetPlaylistLength,
  playlist,
  setPlaylist,
  recommendations,
  setRecommendations,
  addRecToPlaylist,
}: PlaylistProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string>(""); // Id of current track being previewed
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const [loadingSaveStatusTrackIds, setLoadingSaveStatusTrackIds] = useState<
    string[]
  >([]);
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
    playlist: Map<string, TrackObject> | null
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
    setTargetPlaylistLength((prev) => prev + 10); // Show 10 more tracks each time
  };

  function playSampleTrack(trackId: string) {
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
  }

  function removeFromPlaylist(trackId: string) {
    const updatedPlaylist = playlist?.filter(
      (track) => track.track.id != trackId
    );
    updatedPlaylist && setPlaylist(updatedPlaylist);
  }

  function pinToPlaylist(trackId: string) {
    const updatedPlaylist = playlist!.map((track) => {
      if (track.track.id === trackId) {
        console.log("found matching track");
        if (track.pinned && track.pinned === true) {
          return {
            ...track,
            pinned: false,
          };
        } else if (!track.pinned) {
          console.log(
            "Track pinned status not saved. Returning following object: ",
            { ...track, pinned: true }
          );
          return {
            ...track,
            pinned: true,
          };
        }
      }
      return track;
    });

    setPlaylist(updatedPlaylist);
  }

  // Updates track's saved status in Spotify & IDB
  // Updates saved status accordingly in playlist
  // Adds loading icon while awaiting Spotify API reqs
  async function handleSaveClick(trackObj: TrackObject, saved: boolean) {
    setLoadingSaveStatusTrackIds((prevIds) => [...prevIds, trackObj.track.id]); // Add trackid to loading list

    const updateStatus: string | null = await updateSavedStatus(
      trackObj,
      saved
    );
    if (!updateStatus) console.log("Failed to update track saved status");

    setPlaylist((prevPlaylist) =>
      prevPlaylist!.map((track) =>
        track.track.id === trackObj.track.id
          ? { ...track, saved: updateStatus === "Added" }
          : track
      )
    );

    setRecommendations((prevRecs) =>
      prevRecs!.map((track) =>
        track.track.id === trackObj.track.id
          ? { ...track, saved: updateStatus === "Added" }
          : track
      )
    );
    setLoadingSaveStatusTrackIds((prevIds) =>
      prevIds.filter((id) => id !== trackObj.track.id)
    ); // Filter for all but the current track id
  }

  const rows = Array.from(playlist)
    .slice(0, targetPlaylistLength)
    .map((track) => (
      <Table.Tr key={track[1].track.id}>
        <TrackRow
          track={track[1]}
          audioRefs={audioRefs}
          playingTrackId={playingTrackId}
          playSampleTrack={playSampleTrack}
          handleSaveClick={handleSaveClick}
          loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
        />
        <Table.Td>
          <Button onClick={() => removeFromPlaylist(track[1].track.id)}>
            <IconCircleMinus stroke={2} size={16} />
          </Button>
        </Table.Td>
        <Table.Td>
          <Button onClick={() => pinToPlaylist(track[1].track.id)}>
            {track[1].pinned === true ? (
              <IconPinFilled size={16} />
            ) : (
              <IconPin stroke={2} size={16} />
            )}
          </Button>
        </Table.Td>
      </Table.Tr>
    ));

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
      {targetPlaylistLength < playlist.size && (
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
          loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
          addRecToPlaylist={addRecToPlaylist}
        />
      )}
    </div>
  );
}
