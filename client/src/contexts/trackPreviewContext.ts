import { createContext } from "react";

interface PlaybackContextType {
  playingTrackId: string | null;
  setPlayingTrackId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Context for managing which track preview is playing
export const PlaybackContext = createContext<PlaybackContextType>({
  playingTrackId: null,
  setPlayingTrackId: () => {},
});
