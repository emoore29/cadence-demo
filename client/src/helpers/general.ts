import { TrackObject } from "@/types/types";
import { notifications } from "@mantine/notifications";
import { deleteFromStore, getFromStore, setInStore } from "./database";

export function showSuccessNotif(title: string, message: string) {
  notifications.show({
    color: "green",
    title: title,
    message: message,
  });
}

export function showErrorNotif(title: string, message: string) {
  notifications.show({
    color: "red",
    title: title,
    message: message,
  });
}

export function showWarnNotif(title: string, message: string) {
  notifications.show({
    color: "yellow",
    title: title,
    message: message,
  });
}

export async function syncSpotifyAndIdb(track: TrackObject, saved: boolean) {
  // Although getFromStore may return Track or Artist, we know it always returns a TrackObject from the "library"
  const savedInDb = (await getFromStore("library", track.track.id)) as
    | TrackObject
    | undefined;

  // Ensure IDB matches Spotify
  // If song saved in Spotify but not in IDB, add to IDB
  if (saved && !savedInDb) {
    await setInStore("library", track);
    console.log("added to IDB");
  } else if (!saved && savedInDb) {
    // If song not saved in Spotify but saved in IDB, rm from IDB
    await deleteFromStore("library", track.track.id);
    console.log("removed from IDB");
  }
}

export function calculatePlaylistTime(
  playlist: Map<string, TrackObject>
): string {
  let totalTimeMs = 0;
  for (const value of playlist.values()) {
    const trackTime = value.track.duration_ms;
    totalTimeMs += trackTime;
  }

  // Convert ms to h/m/s
  return msToPlaylistTime(totalTimeMs);
}

function msToPlaylistTime(ms: number): string {
  // Convert ms to seconds, rounding
  let totalSeconds = Math.round(ms / 1000);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours.toString()} hr ${minutes.toString()} min`
    : `${minutes.toString()} min ${seconds.toString()} sec`;
}

export function msToTrackTime(ms: number): string {
  // Convert ms to seconds, rounding
  let totalSeconds = Math.round(ms / 1000);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes.toString()}:${seconds.toString().padStart(2, "0")}`;
}
