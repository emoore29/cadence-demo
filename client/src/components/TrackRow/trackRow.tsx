import { msToTrackTime } from "@/helpers/general";
import LikeIcon from "@/components/LikeIcon/LikeIcon";
import LikedIcon from "@/components/LikedIcon/LikedIcon";
import { TrackObject } from "@/types/types";
import { Button, Loader, Table } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconPinFilled } from "@tabler/icons-react";
import React from "react";
import TrackPreview from "../TrackPreview/trackPreview";
import styles from "./trackRow.module.css";

type TrackRowProps = {
  pinToPlaylist?: (trackId: string) => void;
  listType: string;
  track: TrackObject;
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  playingTrackId: string | null;
  playTrackPreview: (id: string) => void;
  handleSaveClick: (
    listType: string,
    trackObj: TrackObject,
    saved: boolean
  ) => void;
  loadingSaveStatusTrackIds: string[];
  strokeDashoffset: number;
};

export default function TrackRow({
  pinToPlaylist,
  listType,
  track,
  audioRefs,
  playingTrackId,
  playTrackPreview,
  handleSaveClick,
  loadingSaveStatusTrackIds,
  strokeDashoffset,
}: TrackRowProps) {
  const isMobile = useMediaQuery("(max-width: 50em)");
  return (
    <>
      <Table.Td>
        <div className={styles.trackDisplay}>
          <div className={styles.artAndPreview}>
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
              className={styles.albumArt}
            />
          </div>
          <div className={styles.titleAndArtist}>
            <div className={styles.pinAndTitle}>
              {pinToPlaylist && track.pinned === true && (
                <button
                  className={styles.pin}
                  onClick={() => pinToPlaylist(track.track.id)}
                >
                  <IconPinFilled
                    style={{ transform: "rotateZ(270deg)" }}
                    size={18}
                  />
                </button>
              )}
              <a
                className={styles.trackName}
                href={track.track.external_urls.spotify}
              >
                {track.track.name}
              </a>
            </div>

            <a
              className={styles.trackArtist}
              href={track.track.artists[0].external_urls.spotify}
            >
              {track.track.artists[0].name}
            </a>
          </div>
        </div>
      </Table.Td>
      {!isMobile && (
        <Table.Td>
          <a
            className={styles.trackAlbum}
            href={track.track.album.external_urls.spotify}
          >
            {track.track.album.name}
          </a>
        </Table.Td>
      )}
      {!isMobile && (
        <Table.Td className={styles.centerTd}>
          <Button
            type="button"
            className={styles.trackActionButton}
            disabled={loadingSaveStatusTrackIds.includes(track.track.id)}
            onClick={() => handleSaveClick(listType, track, track.saved!)}
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
      )}
      <Table.Td
        className={styles.rightTd}
        style={{
          paddingRight: "5px",
        }}
      >
        {msToTrackTime(track.track.duration_ms)}
      </Table.Td>
    </>
  );
}
