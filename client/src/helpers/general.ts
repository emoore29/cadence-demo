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
  if ((saved && savedInDb) || (!saved && !savedInDb)) {
    console.log("IDB matches Spotify");
  } else {
    console.log("IDB does not match Spotify");
    // If song saved in Spotify but not in IDB, add to IDB
    if (saved && !savedInDb) {
      await setInStore("library", track);
      console.log("added to IDB");
    } else {
      // If song not saved in Spotify but saved in IDB, rm from IDB
      await deleteFromStore("library", track.track.id);
      console.log("removed from IDB");
    }
  }
}
