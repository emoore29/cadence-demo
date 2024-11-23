import { getRecommendations } from "@/helpers/playlist";
import { FormValues, TrackObject } from "@/types/types";
import { Button, Group, Table } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { MutableRefObject } from "react";
import SkeletonRow from "./skeletonRow";
import TableHead from "./tableHead";
import TrackRow from "./trackRow";

interface RecommendationsProps {
  playlist: Map<string, TrackObject>;
  setPlaylist: React.Dispatch<React.SetStateAction<Map<string, TrackObject>>>;
  recommendations: Map<string, TrackObject>;
  setRecommendations: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject>>
  >;
  setLoadingRecs: React.Dispatch<React.SetStateAction<boolean>>;
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
  form: UseFormReturnType<FormValues>;
  anyTempo: boolean;
}

export default function Recommendations({
  playlist,
  setPlaylist,
  recommendations,
  setRecommendations,
  handleSaveClick,
  loadingSaveStatusTrackIds,
  setLoadingRecs,
  playTrackPreview,
  playingTrackId,
  audioRefs,
  circleOffsets,
  form,
  anyTempo,
}: RecommendationsProps) {
  if (!recommendations) return <div></div>;

  // Adds a recommendation to the playlist, and checks if this makes recs.size < 5, if so, fetches more recs
  async function addRecToPlaylist(track: TrackObject) {
    // Add recommendation to playlist
    setPlaylist((prevPlaylist) => {
      const newPlaylist = new Map(prevPlaylist);
      newPlaylist.set(track.track.id, track);
      return newPlaylist;
    });

    // Remove recommendation from recommendations
    setRecommendations((prevRecs) => {
      const newRecs = new Map(prevRecs);
      newRecs.delete(track.track.id);
      return newRecs;
    });

    // If recs.length <= 3, fetch new recs and add to recs
    // Spotify will return the same recs as before. TODO: Update fetchRecs() to create variety in recs
    if (recommendations && recommendations.size <= 3) {
      const recs: Map<string, TrackObject> | null = await getRecommendations(
        form.values,
        anyTempo,
        100
      );
      if (!recs) return;

      // Loop through recs items, checking if already in playlist
      for (const key of recs.keys()) {
        if (playlist?.get(key) || recommendations.get(key)) {
          recs.delete(key);
        }
      }

      // TODO: If recsMap 0 or low due to filter restraints, fetch more with new set of artists/tracks/genres?

      setRecommendations((prevRecs) => {
        // Init newRecs Map for adding newRecs to prevRecs
        const newRecs = new Map([...(prevRecs ?? []), ...recs]); // prevRecs as [] if there are no prevRecs
        return newRecs;
      });
    }
  }

  async function handleRefreshRecs() {
    let updatedRecs = new Map(recommendations); // Copy current state to avoid mutating
    const tempArray = Array.from(updatedRecs).slice(2, -1); // Remove first 3 tracks from current recs
    updatedRecs = new Map(tempArray); // Add newly sliced recs to map

    console.log("updated recs", updatedRecs);

    let newlyFetchedRecs: Map<string, TrackObject> | null; // Initialise Map to store newly fetched recs

    // Fetch new recs if updatedRecs <=5
    if (updatedRecs.size < 3) {
      console.log("Fetching 9 more recs");
      setLoadingRecs(true);
      // fetch and add new recs
      newlyFetchedRecs = await getRecommendations(form.values, anyTempo, 100);
      if (!newlyFetchedRecs) return;

      // Loop through recs items, removing tracks that are already in playlist
      for (const key of newlyFetchedRecs.keys()) {
        if (playlist?.get(key)) {
          newlyFetchedRecs.delete(key);
        }
      }
      // TODO: If newly fetched recs <= 5, try new seeds and get more
      const finalisedRecs = new Map([...updatedRecs, ...newlyFetchedRecs]);

      setRecommendations(finalisedRecs);
      setLoadingRecs(false);
    } else {
      setRecommendations(updatedRecs);
    }
  }

  const rows = Array.from(recommendations!)
    .slice(0, 3) // Only display 5. If one is removed, it automatically adds the next one in the array
    .map((track) => (
      <Table.Tr key={track[1].track.id}>
        <TrackRow
          listType="Recommendations"
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
        <TableHead type="recommended" />
        <Table.Tbody>
          {rows}
          {/* Add skeleton rows if recommendations < 3 */}
          {recommendations.size === 2 && <SkeletonRow />}
          {recommendations.size === 1 && (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}
          {recommendations.size === 0 && <div>No recommendations found.</div>}
        </Table.Tbody>
      </Table>
      <Group justify="flex-end" mt="md">
        <Button onClick={handleRefreshRecs}>Refresh</Button>
      </Group>
    </>
  );
}
