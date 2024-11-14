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
  return msToTime(totalTimeMs);
}

function msToTime(ms: number): string {
  let seconds;
  let remainderSeconds;
  let minutes;
  let remainderMinutes;
  let hours;

  // Divide by 1000 to get num seconds (discard the extra)
  seconds = Math.floor(ms / 1000); // ignore remainder ms

  // If seconds <= 60
  // Divide by 60 to get num minutes ()
  if (seconds >= 60) {
    minutes = Math.floor(seconds / 60);
    remainderSeconds = seconds % 60;
  }

  // If mins > 60, divide mins by 60 to get num hours
  if (minutes && minutes >= 60) {
    hours = Math.floor(minutes / 60);
    remainderMinutes = minutes % 60;
  }

  let totalTime: string;
  if (hours) {
    totalTime =
      hours.toString() +
      " hr " +
      remainderMinutes?.toString() +
      " min " +
      remainderSeconds?.toString() +
      " sec";
  } else if (minutes) {
    totalTime =
      minutes.toString() + " min " + remainderSeconds?.toString() + " sec";
  } else {
    totalTime = seconds.toString() + " sec";
  }
  return totalTime;
}
