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
  Modal,
  Table,
  TextInput,
  Skeleton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { IconCircleMinus, IconPin, IconPinFilled } from "@tabler/icons-react";
import { useRef, useState } from "react";
import Recommendations from "./recommendations";
import TrackRow from "./trackRow";

interface PlaylistProps {
  setMatchingTracks: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject> | null>
  >;
  matchingTracks: Map<string, TrackObject> | null;
  targetPlaylistLength: number;
  setTargetPlaylistLength: React.Dispatch<React.SetStateAction<number>>;
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
  loadingPlaylist: boolean;
}

export default function Playlist({
  setMatchingTracks,
  matchingTracks,
  targetPlaylistLength,
  setTargetPlaylistLength,
  playlist,
  setPlaylist,
  recommendations,
  setRecommendations,
  addRecToPlaylist,
  handleRefreshRecs,
  loadingPlaylist,
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
    playlist: Map<string, TrackObject>
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
  // Updates saved status accordingly in playlist
  // Adds loading icon while awaiting Spotify API reqs
  async function handleSaveClick(trackObj: TrackObject, saved: boolean) {
    setLoadingSaveStatusTrackIds((prevIds) => [...prevIds, trackObj.track.id]); // Add trackid to loading list

    const updateStatus: string | null = await updateSavedStatus(
      trackObj,
      saved
    );
    if (!updateStatus) console.log("Failed to update track saved status");

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
  }

  const rows = Array.from(playlist).map((track) => (
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
        <Button
          className="trackActionButton"
          onClick={() => removeFromPlaylist(track[1].track.id)}
        >
          <IconCircleMinus stroke={2} size={16} />
        </Button>
      </Table.Td>
      <Table.Td>
        <Button
          className="trackActionButton"
          onClick={() => pinToPlaylist(track[1].track.id)}
        >
          {track[1].pinned === true ? (
            <IconPinFilled size={16} />
          ) : (
            <IconPin stroke={2} size={16} />
          )}
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
        <Table.Thead>
          <Table.Tr>
            <Table.Th></Table.Th>
            <Table.Th style={{ width: "45%" }}>Title</Table.Th>
            <Table.Th style={{ width: "45%" }}>Album</Table.Th>
            <Table.Th>Length</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

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
      <Group justify="flex-end" mt="md">
        {matchingTracks && matchingTracks.size > 0 && (
          <Button
            color="rgba(255, 255, 255, 0.8)"
            variant="outline"
            type="button"
            onClick={showMoreResults}
          >
            Show more results (+5)
          </Button>
        )}
        {matchingTracks && matchingTracks.size > 0 && (
          <Button
            color="rgba(255, 255, 255, 0.8)"
            variant="outline"
            type="button"
            onClick={showAllResults}
          >
            Show all results (+{matchingTracks.size})
          </Button>
        )}
        <Button
          color="rgba(255, 255, 255, 0.8)"
          variant="outline"
          type="button"
          onClick={() => setOpened(true)}
        >
          Save as playlist
        </Button>
      </Group>

      {recommendations && (
        <Recommendations
          recommendations={recommendations}
          playlist={playlist}
          setPlaylist={setPlaylist}
          setRecommendations={setRecommendations}
          handleSaveClick={handleSaveClick}
          loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
          addRecToPlaylist={addRecToPlaylist}
          handleRefreshRecs={handleRefreshRecs}
        />
      )}
    </div>
  );
}
