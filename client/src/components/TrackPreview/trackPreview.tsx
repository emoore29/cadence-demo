import PreviewCircle from "@/components/PreviewCircle/PreviewCircle";
import { PlaybackContext } from "@/contexts/trackPreviewContext";
import { showErrorNotif } from "@/helpers/general";
import { TrackObject } from "@/types/types";
import { Button, Loader } from "@mantine/core";
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlaylistOff,
} from "@tabler/icons-react";
import { useContext, useEffect, useRef, useState } from "react";
import styles from "./trackPreview.module.css";

interface TrackPreviewProps {
  track: TrackObject;
}

export default function TrackPreview({ track }: TrackPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [circleOffset, setCircleOffset] = useState<number>(2 * Math.PI * 18);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get playback context
  const { playingTrackId, setPlayingTrackId } = useContext(PlaybackContext);

  // Get playing state of this component's track
  const isPlaying = playingTrackId === track.track.id;

  const fetchPreviewUrl = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/search_deezer?trackName=${encodeURIComponent(
          track.track.name
        )}&trackArtist=${encodeURIComponent(
          track.track.artists[0].name
        )}&trackAlbum=${encodeURIComponent(track.track.album.name)}`
      );
      const data = await response.json();
      const preview = data.previewUrl;
      if (preview) {
        setPreviewUrl(preview);
        // Store expiry time and preview url
        const expiry = preview.match(/exp=(\d+)/)[1]; // get expiry from url with regex
        const previewData: { preview: string; expiry: string } = {
          preview,
          expiry,
        };
        sessionStorage.setItem(
          `expiry_${track.track.id}`,
          JSON.stringify(previewData)
        );
      } else {
        showErrorNotif(
          "No preview available",
          `Could not retrieve preview for ${track.track.name}`
        );
        setPreviewUrl("na");
      }
    } catch (error) {
      showErrorNotif(
        "Network error",
        `Could not retrieve preview for ${track.track.name}`
      );
    }
    setIsLoading(false);
  };

  // Calculates dimensions of track preview circle as duration changes
  function calculateOffset(timeLeft: number): number {
    const radius: number = 18; // Should match radius - strokeWidth in PreviewCircle
    const circumference = 2 * Math.PI * radius; // Based on circle dimensions
    let trackDuration = 29.712653; // Based on Spotify preview times

    // Calculate percentage of time left, offset dasharray by that amount.
    const strokeDashoffset = (timeLeft / trackDuration) * circumference;
    return strokeDashoffset;
  }

  // Update circle offset when audio plays
  useEffect(() => {
    const audioElement: HTMLAudioElement | null = audioRef.current;
    if (!audioElement) return;

    // Attach time update event to update circle preview (if one doesn't already exist)
    const updateProgress = () => {
      const remaining: number =
        audioElement.duration - audioElement.currentTime;
      const offset: number = calculateOffset(remaining);
      setCircleOffset(offset);
    };

    audioElement.addEventListener("timeupdate", updateProgress);

    // Cleanup event listener on unmount
    return () => audioElement.removeEventListener("timeupdate", updateProgress);
  }, []);

  // Handle when another track starts playing
  useEffect(() => {
    if (playingTrackId !== track.track.id && audioRef.current) {
      audioRef.current.pause();
    }
  }, [playingTrackId, track.track.id]);

  // Handle play/pause
  const handlePlayPause = async () => {
    const audioElement: HTMLAudioElement | null = audioRef.current;
    if (!audioElement) {
      console.log("No audio element found");
      return;
    }

    if (isPlaying) {
      audioElement.pause();
      setPlayingTrackId(null);
    } else {
      // Check if preview has expired before fetching a new preview
      const previewDataString = sessionStorage.getItem(
        `expiry_${track.track.id}`
      );

      if (!previewDataString) {
        console.log("No preview data stored");
        await fetchPreviewUrl();
      } else {
        const previewData = JSON.parse(previewDataString) as {
          preview: string;
          expiry: string;
        };
        const expiry: number = Number(previewData.expiry);
        const previewUrl: string = previewData.preview;
        const now = Math.floor(Date.now() / 1000);
        if (now > expiry) {
          console.warn("Track preview has expired. Fetching new preview");
          await fetchPreviewUrl();
        } else {
          setPreviewUrl(previewUrl);
        }
      }

      setPlayingTrackId(track.track.id);
      try {
        await audioElement.play();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }

    // Attach onended event handler to reset play/pause when track ends
    if (!audioElement.onended) {
      audioElement.onended = () => {
        setPlayingTrackId(""); // remove track id from "playing track" state to reset play btn
      };
    }
  };

  return (
    <div
      className={
        playingTrackId === track.track.id || isLoading
          ? styles.activeTrackPreviewOverlay
          : styles.trackPreviewOverlay
      }
    >
      {previewUrl == "na" ? (
        <IconPlaylistOff stroke={2} size={16} />
      ) : (
        <>
          <audio ref={audioRef} id={`audio-${track.track.id}`}>
            {previewUrl && (
              <>
                <source src={previewUrl} type="audio/ogg" />
                <source src={previewUrl} type="audio/mpeg" />
              </>
            )}
            Your browser does not support the audio element.
          </audio>
          <PreviewCircle
            trackId={track.track.id}
            playingTrackId={playingTrackId}
            size={28}
            offset={circleOffset}
          />
          <Button
            type="button"
            className={
              playingTrackId === track.track.id
                ? styles.activeTrackPreviewButton
                : styles.trackPreviewButton
            }
            onClick={() => handlePlayPause()}
          >
            {isLoading ? (
              <Loader color="white" size={16} />
            ) : playingTrackId === track.track.id ? (
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
