import { TrackObject } from "@/types/types";
import { Button, Group, Table } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { MutableRefObject, useRef, useState } from "react";
import TrackRow from "./trackRow";
import TableHead from "./tableHead";

interface RecommendationsProps {
  recommendations: Map<string, TrackObject>;
  handleSaveClick: (trackObj: TrackObject, saved: boolean) => void;
  loadingSaveStatusTrackIds: string[];
  addRecToPlaylist: (track: TrackObject) => void;
  handleRefreshRecs: () => void;
  playTrackPreview: (trackId: string) => void;
  playingTrackId: string;
  audioRefs: MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  circleOffsets: Record<string, number>;
}

export default function Recommendations({
  recommendations,
  handleSaveClick,
  loadingSaveStatusTrackIds,
  addRecToPlaylist,
  handleRefreshRecs,
  playTrackPreview,
  playingTrackId,
  audioRefs,
  circleOffsets,
}: RecommendationsProps) {
  if (!recommendations) return <div>No recommendations available</div>;

  const rows = Array.from(recommendations!)
    .slice(0, 3) // Only display 5. If one is removed, it automatically adds the next one in the array
    .map((track) => (
      <Table.Tr key={track[1].track.id}>
        <TrackRow
          track={track[1]}
          audioRefs={audioRefs}
          playingTrackId={playingTrackId}
          playTrackPreview={playTrackPreview}
          handleSaveClick={handleSaveClick}
          loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
          strokeDashoffset={circleOffsets[track[1].track.id] || 2 * Math.PI * 5}
        />
        <Table.Td>
          <Button
            className="trackActionButton"
            onClick={() => addRecToPlaylist(track[1])}
          >
            Add
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
        <TableHead />
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Group justify="flex-end" mt="md">
        <Button onClick={handleRefreshRecs}>Refresh</Button>
      </Group>
    </>
  );
}
