import { TrackObject } from "@/types/types";
import { Table, Tooltip, Loader, Button } from "@mantine/core";
import {
  IconHeart,
  IconHeartFilled,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
} from "@tabler/icons-react";
import React from "react";

type TrackRowProps = {
  track: TrackObject;
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  playingTrackId: string | null;
  playSampleTrack: (id: string) => void;
  handleSaveClick: (trackObj: TrackObject, saved: boolean) => void;
  loadingSaveStatusTrackIds: string[];
};

export default function TrackRow(props: TrackRowProps) {
  const {
    track,
    audioRefs,
    playingTrackId,
    playSampleTrack,
    handleSaveClick,
    loadingSaveStatusTrackIds,
  } = props;

  return (
    <>
      <Table.Td className="centerContent">
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
            <Button
              type="button"
              className="trackActionButton"
              onClick={() => playSampleTrack(track.track.id)}
            >
              {playingTrackId === track.track.id ? (
                <IconPlayerPauseFilled size={16} />
              ) : (
                <IconPlayerPlayFilled size={16} />
              )}
            </Button>
          </>
        )}
      </Table.Td>
      <Tooltip.Floating
        multiline
        w={200}
        label={
          <>
            {`Tempo: ${track.features.tempo.toFixed(0)}`} <br />
            {`Valence: ${track.features.valence.toFixed(1)}`} <br />
            {`Energy: ${track.features.energy.toFixed(1)}`} <br />
            {`Acousticness: ${track.features.acousticness.toFixed(1)}`} <br />
            {`Instrumentalness: ${track.features.instrumentalness.toFixed(1)}`}
            <br />
            {`Danceability: ${track.features.danceability.toFixed(1)}`} <br />
            {`Liveness: ${track.features.liveness.toFixed(1)}`} <br />
            {`Loudness: ${track.features.loudness.toFixed(1)}`} <br />
            {`Mode: ${track.features.mode.toFixed(1)}`} <br />
            {`Speechiness: ${track.features.speechiness.toFixed(1)}`} <br />
            {`Time signature: ${track.features.time_signature.toFixed(1)}`}
          </>
        }
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
                className="trackLink"
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
                className="trackArtist"
                href={track.track.artists[0].external_urls.spotify}
              >
                {track.track.artists[0].name}
              </a>
            </div>
          </div>
        </Table.Td>
      </Tooltip.Floating>
      <Table.Td>
        <a
          className="trackAlbum"
          href={track.track.album.external_urls.spotify}
        >
          {track.track.album.name}
        </a>
      </Table.Td>
      <Table.Td>Track Length</Table.Td>
      <Table.Td>
        <Button
          type="button"
          className="trackActionButton"
          disabled={loadingSaveStatusTrackIds.includes(track.track.id)}
          onClick={() => handleSaveClick(track, track.saved!)}
        >
          {loadingSaveStatusTrackIds.includes(track.track.id) ? (
            <Loader size={16} />
          ) : track.saved === true ? (
            <IconHeartFilled size={16} />
          ) : (
            <IconHeart stroke={2} size={16} />
          )}
        </Button>
      </Table.Td>
    </>
  );
}
