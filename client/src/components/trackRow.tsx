import { msToTrackTime } from "@/helpers/general";
import LikeIcon from "@/icons/LikeIcon";
import LikedIcon from "@/icons/LikedIcon";
import { TrackObject } from "@/types/types";
import { Button, Loader, Table } from "@mantine/core";
import React from "react";
import TrackPreview from "./trackPreview";

type TrackRowProps = {
  track: TrackObject;
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  playingTrackId: string | null;
  playTrackPreview: (id: string) => void;
  handleSaveClick: (trackObj: TrackObject, saved: boolean) => void;
  loadingSaveStatusTrackIds: string[];
  strokeDashoffset: number;
};

export default function TrackRow({
  track,
  audioRefs,
  playingTrackId,
  playTrackPreview,
  handleSaveClick,
  loadingSaveStatusTrackIds,
  strokeDashoffset,
}: TrackRowProps) {
  return (
    <>
      {/* <Tooltip.Floating
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
      > */}
      <Table.Td>
        <div className="trackDisplay">
          <div className="artAndPreview">
            <TrackPreview
              audioRefs={audioRefs}
              track={track}
              playingTrackId={playingTrackId}
              strokeDashoffset={strokeDashoffset}
              playTrackPreview={playTrackPreview}
            />

            <img
              src={track.track.album.images[0].url}
              alt={`${track.track.album.name} album art`}
              className="albumArt"
            />
          </div>

          <div
            className="titleAndArtist"
            style={{
              maxWidth: 300, // Limit cell width
            }}
          >
            <a className="trackLink" href={track.track.external_urls.spotify}>
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
      {/* </Tooltip.Floating> */}
      <Table.Td>
        <a
          className="trackAlbum"
          href={track.track.album.external_urls.spotify}
        >
          {track.track.album.name}
        </a>
      </Table.Td>
      <Table.Td>
        <Button
          type="button"
          className="trackActionButton likeBtn"
          disabled={loadingSaveStatusTrackIds.includes(track.track.id)}
          onClick={() => handleSaveClick(track, track.saved!)}
        >
          {loadingSaveStatusTrackIds.includes(track.track.id) ? (
            <Loader color="white" size={16} />
          ) : track.saved === true ? (
            <LikedIcon size={16} />
          ) : (
            <LikeIcon size={16} />
          )}
        </Button>
      </Table.Td>
      <Table.Td className="trackTime">
        {msToTrackTime(track.track.duration_ms)}
      </Table.Td>
    </>
  );
}
