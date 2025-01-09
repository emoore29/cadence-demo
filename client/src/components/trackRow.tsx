import { msToTrackTime } from "@/helpers/general";
import LikeIcon from "@/icons/LikeIcon";
import LikedIcon from "@/icons/LikedIcon";
import { TrackObject } from "@/types/types";
import { Button, Loader, Table } from "@mantine/core";
import React from "react";
import TrackPreview from "./trackPreview";
import { useMediaQuery } from "@mantine/hooks";
import { IconPinFilled } from "@tabler/icons-react";
import { transform } from "lodash";

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
          <div className="titleAndArtist">
            <div>
              {pinToPlaylist && track.pinned === true && (
                <button
                  className="pin"
                  onClick={() => pinToPlaylist(track.track.id)}
                >
                  <IconPinFilled
                    style={{ transform: "rotateZ(270deg)" }}
                    size={18}
                  />
                </button>
              )}{" "}
              <a className="trackName" href={track.track.external_urls.spotify}>
                {track.track.name}
              </a>
            </div>

            <a
              className="trackArtist"
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
            className="trackAlbum"
            href={track.track.album.external_urls.spotify}
          >
            {track.track.album.name}
          </a>
        </Table.Td>
      )}
      {!isMobile && (
        <Table.Td>
          <Button
            type="button"
            className="trackActionButton displayOnTrackHover"
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
        className="trackTime"
        style={{
          paddingRight: "5px",
        }}
      >
        {msToTrackTime(track.track.duration_ms)}
      </Table.Td>
    </>
  );
}
