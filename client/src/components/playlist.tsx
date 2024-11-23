import {
  calculatePlaylistTime,
  showErrorNotif,
  showSuccessNotif,
} from "@/helpers/general";
import { savePlaylist } from "@/helpers/playlist";
import { PlaylistData, TrackObject } from "@/types/types";
import {
  Button,
  Checkbox,
  Group,
  Menu,
  Modal,
  Table,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { IconDots, IconPin, IconPinFilled, IconX } from "@tabler/icons-react";
import { MutableRefObject, useRef, useState } from "react";
import TableHead from "./tableHead";
import TrackRow from "./trackRow";

interface PlaylistProps {
  setMatchingTracks: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject>>
  >;
  matchingTracks: Map<string, TrackObject>;
  playlist: Map<string, TrackObject>;
  setPlaylist: React.Dispatch<React.SetStateAction<Map<string, TrackObject>>>;
  handleSaveClick: (
    listType: string,
    trackObj: TrackObject,
    saved: boolean
  ) => void;
  loadingSaveStatusTrackIds: string[];
  playTrackPreview: (trackId: string) => void;
  playingTrackId: string;
  audioRefs: MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  circleOffsets: Record<string, number>;
}

export default function Playlist({
  setMatchingTracks,
  matchingTracks,
  playlist,
  setPlaylist,
  handleSaveClick,
  loadingSaveStatusTrackIds,
  playTrackPreview,
  playingTrackId,
  audioRefs,
  circleOffsets,
}: PlaylistProps) {
  const [openSavePlaylist, setOpenSavePlaylist] = useState(false);
  const [openTrackMenuId, setOpenTrackMenuId] = useState<string>();
  const isMobile = useMediaQuery("(max-width: 50em)");
  const trackMenuRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      name: "Cadence playlist",
      description: "Cadence playlist description",
      public: true,
    },
  });

  if (playlist.size === 0)
    return <div>Please enter your preferences to generate a playlist.</div>;

  async function handleSubmit(
    formValues: PlaylistData,
    playlist: Map<string, TrackObject>
  ) {
    const savedPlaylist = await savePlaylist(playlist, formValues);
    if (savedPlaylist) {
      showSuccessNotif(
        "Playlist saved",
        "Your playlist was successfully saved."
      );
      setOpenSavePlaylist(false);
    } else {
      showErrorNotif("Error", "Your playlist could not be saved.");
    }
  }

  // Removes a given track from the playlist
  function removeFromPlaylist(trackId: string) {
    setPlaylist((prevPlaylist) => {
      const newPlaylist = new Map(prevPlaylist);
      newPlaylist.delete(trackId);
      return newPlaylist;
    });
  }

  function pinToPlaylist(trackId: string) {
    setPlaylist((prevPlaylist) => {
      // Clone prev playlist to avoid mutation
      const newPlaylist = new Map(prevPlaylist);

      // Retrieve existing track object
      const trackObject = newPlaylist.get(trackId);

      if (trackObject) {
        const updatedTrackObject = {
          ...trackObject,
          pinned: !trackObject.pinned,
        };
        newPlaylist.set(trackId, updatedTrackObject);
      }

      return newPlaylist;
    });
  }

  function handleTrackMenuClick(trackId: string) {
    setOpenTrackMenuId((prev) => (prev === trackId ? "" : trackId));
  }

  const rows = Array.from(playlist).map((track) => (
    <Table.Tr key={track[1].track.id}>
      <TrackRow
        listType="Playlist"
        track={track[1]}
        audioRefs={audioRefs}
        playingTrackId={playingTrackId}
        playTrackPreview={playTrackPreview}
        handleSaveClick={handleSaveClick}
        loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
        strokeDashoffset={circleOffsets[track[1].track.id] || 2 * Math.PI * 5} // Default offset to circumference of circle if not set in state
      />
      <Table.Td>
        {track[1].pinned === true ? (
          <Button
            className="alwaysVisibleTrackActionButton"
            onClick={() => pinToPlaylist(track[1].track.id)}
          >
            <IconPinFilled size={16} />
          </Button>
        ) : (
          <Button
            className="trackActionButton"
            onClick={() => pinToPlaylist(track[1].track.id)}
          >
            <IconPin size={16} />
          </Button>
        )}
      </Table.Td>
      <Table.Td>
        {/* 
        Menu for mobile
        <Menu
          opened={track[1].track.id === openTrackMenuId}
          onClose={() => setOpenTrackMenuId("")}
          position="bottom-end"
          offset={1}
          shadow="md"
          width={200}
        >
          <Menu.Target>
            <Button
              ref={(el) => (trackMenuRefs.current[track[1].track.id] = el)}
              className={`trackActionsMenu ${
                track[1].track.id === openTrackMenuId ? "opened" : ""
              }`}
              onClick={() => handleTrackMenuClick(track[1].track.id)}
            >
              <IconDots stroke={2} size={16} />
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              color="rgba(255,255,255,0.8)"
              onClick={() => removeFromPlaylist(track[1].track.id)}
            >
              Remove
            </Menu.Item>
            <Menu.Item
              color="rgba(255,255,255,0.8)"
              onClick={() => pinToPlaylist(track[1].track.id)}
            >
              {track[1].pinned ? "Unpin" : "Pin"}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu> */}
        <Button
          className="displayOnTrackHover trackActionButton"
          onClick={() => removeFromPlaylist(track[1].track.id)}
        >
          <IconX stroke={2} size={16} />
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  // Adds 5 more matches to playlist (and removes from matching tracks)
  function showMoreResults() {
    if (!matchingTracks) return null;
    const tempArray = Array.from(matchingTracks).slice(0, 5);

    let moreResults: Map<string, TrackObject> = new Map(tempArray);

    let updatedMatchingTracks: Map<string, TrackObject> = new Map(
      matchingTracks
    );
    for (const key of moreResults.keys()) {
      updatedMatchingTracks?.delete(key);
    }

    const updatedPlaylist: Map<string, TrackObject> = new Map([
      ...playlist!,
      ...moreResults,
    ]);
    setPlaylist(updatedPlaylist);
    setMatchingTracks(updatedMatchingTracks);
  }

  // Add all matches to playlist (and removes from matching tracks)
  function showAllResults() {
    let moreResults: Map<string, TrackObject> = new Map(matchingTracks);

    let updatedMatchingTracks: Map<string, TrackObject> = new Map(
      matchingTracks
    );
    for (const key of moreResults.keys()) {
      updatedMatchingTracks?.delete(key);
    }

    const updatedPlaylist: Map<string, TrackObject> = new Map([
      ...playlist!,
      ...moreResults,
    ]);
    setPlaylist(updatedPlaylist);
    4;
    setMatchingTracks(updatedMatchingTracks);
  }

  const playlistTime = calculatePlaylistTime(playlist);

  return (
    <div className="playlistContainer">
      <p>
        {playlist.size} songs, {playlistTime}
      </p>
      <Table
        highlightOnHoverColor="rgba(0,0,0,0.1)"
        withRowBorders={false}
        withColumnBorders={false}
        highlightOnHover
        horizontalSpacing="xs"
        verticalSpacing="xs"
      >
        <TableHead type="playlist" />
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      <Modal.Root
        opened={openSavePlaylist}
        onClose={() => setOpenSavePlaylist(false)}
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
              className="playlistForm"
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
      <Group justify="flex-end" mt="md">
        {matchingTracks && matchingTracks.size > 5 && (
          <Button type="button" onClick={showMoreResults}>
            Show more (+5)
          </Button>
        )}
        {matchingTracks && matchingTracks.size > 0 && (
          <Button type="button" onClick={showAllResults}>
            Show all (+{matchingTracks.size})
          </Button>
        )}
        <Button type="button" onClick={() => setOpenSavePlaylist(true)}>
          Save as playlist
        </Button>
      </Group>
    </div>
  );
}
