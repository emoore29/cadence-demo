import { calculatePlaylistTime } from "@/helpers/general";
import { TrackObject } from "@/types/types";
import { Button, Group, Table, Menu } from "@mantine/core";
import {
  IconPin,
  IconPinFilled,
  IconX,
  IconDotsVertical,
} from "@tabler/icons-react";
import { MutableRefObject, useRef, useState } from "react";
import SavePlaylistModal from "./savePlaylist";
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
  const [openTrackMenuId, setOpenTrackMenuId] = useState<string>();
  const [openSavePlaylist, setOpenSavePlaylist] = useState(false);
  const trackMenuRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Removes a given track from the playlist
  function removeFromPlaylist(trackId: string) {
    setPlaylist((prevPlaylist) => {
      const newPlaylist = new Map(prevPlaylist);
      newPlaylist.delete(trackId);
      return newPlaylist;
    });
  }

  // Pins a track to the playlist
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

  // Handles track menu open/close
  function handleTrackMenuClick(trackId: string) {
    setOpenTrackMenuId((prev) => (prev === trackId ? "" : trackId));
  }

  const rows = Array.from(playlist).map((track) => (
    <Table.Tr key={track[1].track.id}>
      <TrackRow
        pinToPlaylist={pinToPlaylist}
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
              <IconDotsVertical stroke={2} size={16} />
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
        </Menu>
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
      {playlist.size === 0 && (
        <div>No matches found / enter your preferences.</div>
      )}
      <SavePlaylistModal
        playlist={playlist}
        openSavePlaylist={openSavePlaylist}
        setOpenSavePlaylist={setOpenSavePlaylist}
      />
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
