import { TrackObject } from "@/types/types";
import { Table, Tooltip, Button } from "@mantine/core";
import { useRef, useState } from "react";
import {
  IconHeart,
  IconHeartFilled,
  IconCirclePlus,
} from "@tabler/icons-react";

interface RecommendationsProps {
  recommendations: TrackObject[];
  playlist: TrackObject[] | null;
  setPlaylist: React.Dispatch<React.SetStateAction<TrackObject[] | null>>;
  setRecommendations: React.Dispatch<
    React.SetStateAction<TrackObject[] | null>
  >;
  handleSaveClick: (trackId: string, saved: boolean) => void;
}

export default function Recommendations({
  recommendations,
  playlist,
  setPlaylist,
  setRecommendations,
  handleSaveClick,
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
      <Table.Td>
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
              id="playPauseButton"
              onClick={() => playSampleTrack(track.track.id)}
            >
              {playingTrackId === track.track.id ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="icon icon-tabler icons-tabler-filled icon-tabler-player-pause"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
                  <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="icon icon-tabler icons-tabler-filled icon-tabler-player-play"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
                </svg>
              )}
            </button>
          </>
        )}
      </Table.Td>
      <Tooltip.Floating
        multiline
        w={200}
        label={`Tempo: ${track.features.tempo.toFixed(
          0
        )} Energy: ${track.features.energy.toFixed(
          1
        )} Acousticness: ${track.features.acousticness.toFixed(
          1
        )} Instrumentalness: ${track.features.instrumentalness.toFixed(
          1
        )} Danceability: ${track.features.danceability.toFixed(
          1
        )} Liveness: ${track.features.liveness.toFixed(
          1
        )} Loudness: ${track.features.loudness.toFixed(
          1
        )} Mode: ${track.features.mode.toFixed(
          1
        )} Speechiness: ${track.features.speechiness.toFixed(
          1
        )} Time signature: ${track.features.time_signature.toFixed(1)}`}
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
        <Button onClick={() => addToPlaylist(track)}>
          <IconCirclePlus stroke={2} />
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
            <Table.Th>Preview</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>Album</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th>Add</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  );
}
