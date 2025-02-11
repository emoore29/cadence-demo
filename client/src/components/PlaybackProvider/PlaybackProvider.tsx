import { useState } from "react";
import { PlaybackContext } from "@/contexts/trackPreviewContext";

// Provider component to wrap the playlist
export default function PlaybackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  return (
    <PlaybackContext.Provider value={{ playingTrackId, setPlayingTrackId }}>
      {children}
    </PlaybackContext.Provider>
  );
}
