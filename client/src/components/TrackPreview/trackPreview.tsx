import PreviewCircle from "@/components/PreviewCircle/PreviewCircle";
import { TrackObject } from "@/types/types";
import { Button, UnstyledButton } from "@mantine/core";
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlaylistOff,
} from "@tabler/icons-react";
import styles from "./trackPreview.module.css";

interface TrackPreviewProps {
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  track: TrackObject;
  playingTrackId: string | null;
  strokeDashoffset: number;
  playTrackPreview: (id: string) => void;
}

export default function TrackPreview({
  audioRefs,
  track,
  playingTrackId,
  strokeDashoffset,
  playTrackPreview,
}: TrackPreviewProps) {
  return (
    <div
      className={
        playingTrackId === track.track.id
          ? styles.activeTrackPreviewOverlay
          : styles.trackPreviewOverlay
      }
    >
      {!track.track.preview_url ? (
        <IconPlaylistOff stroke={2} size={16} />
      ) : (
        <>
          <audio
            ref={(el) => (audioRefs.current[track.track.id] = el)}
            id={`audio-${track.track.id}`}
          >
            <source src={track.track.preview_url} type="audio/ogg" />
            <source src={track.track.preview_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <PreviewCircle
            trackId={track.track.id}
            playingTrackId={playingTrackId}
            size={28}
            offset={strokeDashoffset}
          />
          <Button
            type="button"
            className={
              playingTrackId === track.track.id
                ? styles.activeTrackPreviewButton
                : styles.trackPreviewButton
            }
            onClick={() => playTrackPreview(track.track.id)}
          >
            {playingTrackId === track.track.id ? (
              <IconPlayerPauseFilled size={16} />
            ) : (
              <IconPlayerPlayFilled size={16} />
            )}
          </Button>
        </>
      )}
    </div>
  );
}
