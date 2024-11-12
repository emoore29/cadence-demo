import { TrackObject } from "@/types/types";
import { Button, Table } from "@mantine/core";
import { IconCirclePlus } from "@tabler/icons-react";
import { useRef, useState } from "react";
import TrackRow from "./trackRow";

interface RecommendationsProps {
  recommendations: TrackObject[];
  playlist: TrackObject[] | null;
  setPlaylist: React.Dispatch<React.SetStateAction<TrackObject[] | null>>;
  setRecommendations: React.Dispatch<
    React.SetStateAction<TrackObject[] | null>
  >;
  handleSaveClick: (trackObj: TrackObject, saved: boolean) => void;
  loadingSaveStatusTrackIds: string[];
}

export default function Recommendations({
  recommendations,
  playlist,
  setPlaylist,
  setRecommendations,
  handleSaveClick,
  loadingSaveStatusTrackIds,
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

  const rows = recommendations!.map((track) => (
    <Table.Tr key={track.track.id}>
      <TrackRow
        track={track}
        audioRefs={audioRefs}
        playingTrackId={playingTrackId}
        playSampleTrack={playSampleTrack}
        handleSaveClick={handleSaveClick}
        loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
      />
      <Table.Td>
        <Button onClick={() => addToPlaylist(track)}>
          <IconCirclePlus stroke={2} size={16} />
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  function addToPlaylist(track: TrackObject) {
    setPlaylist((playlist) => [...playlist!, track]);
    setRecommendations((recommendations) =>
      recommendations
        ? recommendations.filter((recTrack) => recTrack !== track)
        : recommendations
    );
  }

  return (
    <>
      <h2>Recommended</h2>
      <p>Your search didn't yield many results. Here are some suggestions:</p>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: "5%" }}>Preview</Table.Th>
            <Table.Th style={{ width: "40%" }}>Title</Table.Th>
            <Table.Th style={{ width: "40%" }}>Album</Table.Th>
            <Table.Th style={{ width: "5%" }}></Table.Th>
            <Table.Th style={{ width: "5%" }}>Add</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  );
}
