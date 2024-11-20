import { updateSavedStatus } from "@/helpers/fetchers";
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
import { IconDots, IconPinFilled } from "@tabler/icons-react";
import { useRef, useState } from "react";
import Recommendations from "./recommendations";
import TableHead from "./tableHead";
import TrackRow from "./trackRow";

interface PlaylistProps {
  setMatchingTracks: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject> | null>
  >;
  matchingTracks: Map<string, TrackObject> | null;
  playlist: Map<string, TrackObject>;
  setPlaylist: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject> | null>
  >;
  recommendations: Map<string, TrackObject> | null;
  setRecommendations: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject> | null>
  >;
  addRecToPlaylist: (track: TrackObject) => void;
  handleRefreshRecs: () => void;
}

export default function Playlist({
  setMatchingTracks,
  matchingTracks,
  playlist,
  setPlaylist,
  recommendations,
  setRecommendations,
  addRecToPlaylist,
  handleRefreshRecs,
}: PlaylistProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string>(""); // Id of current track being previewed
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const trackMenuRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [loadingSaveStatusTrackIds, setLoadingSaveStatusTrackIds] = useState<
    string[]
  >([]);
  const [openSavePlaylist, setOpenSavePlaylist] = useState(false);
  const isMobile = useMediaQuery("(max-width: 50em)");
  const [circleOffsets, setCircleOffsets] = useState<Record<string, number>>(
    {}
  ); // Stores time left on each track in playlist
  const [openTrackMenuId, setOpenTrackMenuId] = useState<string>();

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

  function playTrackPreview(trackId: string) {
    const audioElement = audioRefs.current[trackId];

    if (!audioElement) return; // Early return if no audio element found
    audioElement.volume = 0.3; // Set vol

    // Attach timeupdate event to update circle preview (if one doesn't already exist)
    if (!audioElement.ontimeupdate) {
      audioElement.ontimeupdate = () => {
        // Calculate remaining time in track audio preview
        const remaining = audioElement.duration - audioElement.currentTime;
        const offset = calculateOffset(remaining);

        // Calculate offset from `remaining` and add to circleOffsets
        setCircleOffsets((prev) => ({
          ...prev,
          [trackId]: offset,
        }));
      };
    }

    // Attach onended event handler to reset play/pause when track ends
    if (!audioElement.onended) {
      audioElement.onended = () => {
        setPlayingTrackId(""); // remove track id from "playing track" state to reset play btn
      };
    }

    // Handle pause/play of tracks
    if (audioElement.paused) {
      // Pause any other track that is playing
      if (playingTrackId && playingTrackId !== trackId) {
        audioRefs.current[playingTrackId]?.pause();
      }

      // Recalculate offset for new track being played
      setCircleOffsets((prev) => ({
        ...prev,
        [trackId]: calculateOffset(
          audioElement.duration - audioElement.currentTime
        ),
      }));
      setPlayingTrackId(trackId);
      audioElement.play();
    } else {
      setPlayingTrackId("");
      audioElement.pause();
    }
  }

  // Calculates dimensions of circle as duration changes
  function calculateOffset(timeLeft: number): number {
    const circumference = 2 * Math.PI * 18;
    let trackDuration = 29.712653;
    // Calculate percentage of time left, offset dasharray by that amount.
    const strokeDashoffset = (timeLeft / trackDuration) * circumference;
    return strokeDashoffset;
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

  // Updates track's saved status in Spotify & IDB
  // Updates saved indicator accordingly in playlist
  // Adds loading icon while awaiting Spotify API reqs
  async function handleSaveClick(trackObj: TrackObject, saved: boolean) {
    setLoadingSaveStatusTrackIds((prevIds) => [...prevIds, trackObj.track.id]); // Add trackid to loading list

    const updateStatus: string | null = await updateSavedStatus(
      trackObj,
      saved
    );
    if (!updateStatus) {
      console.log("Failed to update track saved status");
      setLoadingSaveStatusTrackIds((prevIds) =>
        prevIds.filter((id) => id !== trackObj.track.id)
      );
      return;
    }

    // On successful saved status update request, update track saved status in playlist/recommendations
    setPlaylist((prevPlaylist) => {
      const newPlaylist = new Map(prevPlaylist);

      const trackObject = newPlaylist.get(trackObj.track.id);

      if (trackObject) {
        const updatedTrackObject = {
          ...trackObject,
          saved: updateStatus === "Added",
        };
        newPlaylist.set(trackObj.track.id, updatedTrackObject);
      }
      return newPlaylist;
    });

    setRecommendations((prevRecs) => {
      const newRecs = new Map(prevRecs);

      const trackObject = newRecs.get(trackObj.track.id);

      if (trackObject) {
        const updatedTrackObject = {
          ...trackObject,
          saved: updateStatus === "Added",
        };
        newRecs.set(trackObj.track.id, updatedTrackObject);
      }
      return newRecs;
    });

    setLoadingSaveStatusTrackIds((prevIds) =>
      prevIds.filter((id) => id !== trackObj.track.id)
    ); // Filter for all but the current track id

    // Once saved status has been updated, display toast that indicates success
    saved
      ? showSuccessNotif("", "Removed from Liked Songs")
      : showSuccessNotif("", "Added to Liked Songs");
  }

  function handleTrackMenuClick(trackId: string) {
    setOpenTrackMenuId((prev) => (prev === trackId ? "" : trackId));
  }

  const rows = Array.from(playlist).map((track) => (
    <Table.Tr key={track[1].track.id}>
      <TrackRow
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
              <IconDots stroke={2} size={16} />
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => removeFromPlaylist(track[1].track.id)}>
              <Button className="trackActionButton">Remove</Button>
            </Menu.Item>
            <Menu.Item onClick={() => pinToPlaylist(track[1].track.id)}>
              <Button className="trackActionButton">
                {track[1].pinned ? "Unpin" : "Pin"}
              </Button>
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
      <Table.Td>
        <Button
          className="trackActionButton"
          onClick={() => pinToPlaylist(track[1].track.id)}
        >
          {track[1].pinned === true && <IconPinFilled size={16} />}
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

    const updatedPlaylist = new Map([...playlist, ...moreResults]);
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

    const updatedPlaylist = new Map([...playlist, ...moreResults]);
    setPlaylist(updatedPlaylist);
    4;
    setMatchingTracks(updatedMatchingTracks);
  }

  const playlistTime = calculatePlaylistTime(playlist);

  return (
    <div className="playlistContainer">
      <h2>Results</h2>
      <p>
        {playlist.size} songs, {playlistTime}
      </p>
      <Table
        highlightOnHoverColor="rgba(0,0,0,0.1)"
        withRowBorders={false}
        highlightOnHover
        horizontalSpacing="xs"
        verticalSpacing="xs"
      >
        <TableHead />
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

      {recommendations && (
        <Recommendations
          recommendations={recommendations}
          handleSaveClick={handleSaveClick}
          loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
          addRecToPlaylist={addRecToPlaylist}
          handleRefreshRecs={handleRefreshRecs}
          playTrackPreview={playTrackPreview}
          playingTrackId={playingTrackId}
          audioRefs={audioRefs}
          circleOffsets={circleOffsets}
        />
      )}
    </div>
  );
}
