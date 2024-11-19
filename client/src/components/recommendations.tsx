import { TrackObject } from "@/types/types";
import { Button, Table, Group } from "@mantine/core";
import { IconCirclePlus } from "@tabler/icons-react";
import { useRef, useState } from "react";
import TrackRow from "./trackRow";
import { getRecommendations } from "@/helpers/playlist";

interface RecommendationsProps {
  recommendations: Map<string, TrackObject>;
  playlist: Map<string, TrackObject> | null;
  setPlaylist: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject> | null>
  >;
  setRecommendations: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject> | null>
  >;
  handleSaveClick: (trackObj: TrackObject, saved: boolean) => void;
  loadingSaveStatusTrackIds: string[];
  addRecToPlaylist: (track: TrackObject) => void;
  handleRefreshRecs: () => void;
}

export default function Recommendations({
  recommendations,
  playlist,
  setPlaylist,
  setRecommendations,
  handleSaveClick,
  loadingSaveStatusTrackIds,
  addRecToPlaylist,
  handleRefreshRecs,
}: RecommendationsProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string>("");
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  if (!recommendations) return <div>No recommendations available</div>;

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

  const rows = Array.from(recommendations!)
    .slice(0, 3) // Only display 5. If one is removed, it automatically adds the next one in the array
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
          <Button
            className="trackActionButton"
            onClick={() => addRecToPlaylist(track[1])}
          >
            <IconCirclePlus stroke={2} size={16} />
          </Button>
        </Table.Td>
      </Table.Tr>
    ));

  return (
    <>
      <h2>Suggestions</h2>
      <Table
        highlightOnHoverColor="rgba(0,0,0,0.1)"
        withRowBorders={false}
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th></Table.Th>
            <Table.Th style={{ width: "50%" }}>Title</Table.Th>
            <Table.Th style={{ width: "50%" }}>Album</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Group justify="flex-end" mt="md">
        <Button onClick={handleRefreshRecs}>Refresh</Button>
      </Group>
    </>
  );
}
