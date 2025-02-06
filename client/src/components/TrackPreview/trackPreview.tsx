import PreviewCircle from "@/components/PreviewCircle/PreviewCircle";
import { TrackObject } from "@/types/types";
import { Button, UnstyledButton } from "@mantine/core";
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlaylistOff,
} from "@tabler/icons-react";
import styles from "./trackPreview.module.css";
import { useContext, useEffect, useRef, useState } from "react";
import { showErrorNotif } from "@/helpers/general";
import { PlaybackContext } from "@/contexts/trackPreviewContext";
import {
  getItemFromLocalStorage,
  storeDataInLocalStorage,
} from "@/helpers/localStorage";

interface TrackPreviewProps {
  track: TrackObject;
}

export default function TrackPreview({ track }: TrackPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [circleOffset, setCircleOffset] = useState<number>(2 * Math.PI * 18);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get playback context
  const { playingTrackId, setPlayingTrackId } = useContext(PlaybackContext);

  // Get playing state of this component's track
  const isPlaying = playingTrackId === track.track.id;

  const fetchPreviewUrl = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:3000/search_deezer?trackName=${encodeURIComponent(
          track.track.name
        )}&trackArtist=${encodeURIComponent(
          track.track.artists[0].name
        )}&trackAlbum=${encodeURIComponent(track.track.album.name)}`
      );
      const data = await response.json();
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
        // Store expiry time
        const expiry = data.previewUrl.match(/exp=(\d+)/)[1]; // get expiry from url with regex
        localStorage.setItem(`expiry_${track.track.id}`, expiry);
      } else {
        showErrorNotif(
          "No preview available",
          `Could not retrieve preview for ${track.track.name}`
        );
        setPreviewUrl("na");
      }
    } catch (error) {
      showErrorNotif(
        "No preview available",
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
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setPlayingTrackId(null);
    } else {
      // Check if preview has expired before fetching a new preview
      let expiry: number = 0;
      const expiryString = getItemFromLocalStorage(`expiry_${track.track.id}`);
      console.log(expiryString);
      if (!expiryString) {
        console.log("No expiry stored");
        await fetchPreviewUrl();
      } else {
        expiry = Number(expiryString);
        const now = Math.floor(Date.now() / 1000);
        console.log("Now, expiry:", now, expiry);
        if (now > expiry) {
          console.log("Track preview has expired. Fetching new preview");
          await fetchPreviewUrl();
        }
      }

      setPlayingTrackId(track.track.id);
      audioElement.play();
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
        playingTrackId === track.track.id
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
