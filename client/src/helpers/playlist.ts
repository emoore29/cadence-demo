import { getAllFromStore } from "@/helpers/database";
import {
  FormValues,
  MetaBrainzFeatures,
  PlaylistData,
  StoreName,
  TrackObject,
} from "@/types/types";
import axios from "axios";
import { showErrorNotif } from "./general";
import { getItemFromLocalStorage } from "./localStorage";

export async function startSearch(
  formValues: FormValues,
  source: string,
  selectedPlaylist: string,
  anyTempo: boolean,
  halfTime: boolean,
  doubleTime: boolean,
  activeSourceTab: string | null,
  chosenTags: string[]
): Promise<Map<string, TrackObject> | null | void> {
  if (activeSourceTab === "mySpotify") {
    switch (source) {
      case "savedTracks":
        return await filterFromStore(
          "savedTracks",
          formValues,
          anyTempo,
          halfTime,
          doubleTime,
          chosenTags
        );

      case "topTracks":
        return await filterFromStore(
          "topTracks",
          formValues,
          anyTempo,
          halfTime,
          doubleTime,
          chosenTags
        );

      default:
        return null;
    }
  } else if (activeSourceTab === "publicPlaylist") {
    return await filterFromPlaylist(
      selectedPlaylist,
      formValues,
      anyTempo,
      halfTime,
      doubleTime,
      chosenTags
    );
  }
}

// Gets songs matching filters from saved songs or top songs library
// Returns array of matching tracks
export async function filterFromStore(
  storeName: StoreName,
  formValues: FormValues,
  anyTempo: boolean,
  halfTime: boolean,
  doubleTime: boolean,
  chosenTags: string[]
): Promise<Map<string, TrackObject> | null> {
  const matchingTracks = new Map<string, TrackObject>();

  try {
    const tracks = await getAllFromStore(storeName);
    for (const track of tracks) {
      const trackFeatures: MetaBrainzFeatures = track.features;
      if (!trackFeatures.key || !trackFeatures.bpm || !trackFeatures.mode) {
        console.warn(`${track.track.id} is missing features.`);
      } else {
        const match: boolean = matches(
          trackFeatures,
          formValues,
          anyTempo,
          halfTime,
          doubleTime,
          chosenTags
        );
        if (match) {
          // If track features match, add to map with id as key
          matchingTracks.set(track.track.id, track);
        }
      }
    }
    return matchingTracks;
  } catch (error) {
    showErrorNotif(
      "Error",
      "There was an error fetching tracks from the database."
    );
    console.error(`Error fetching tracks from IDB ${storeName}`, error);
    return null;
  }
}

export async function filterFromPlaylist(
  selectedPlaylist: string,
  formValues: FormValues,
  anyTempo: boolean,
  halfTime: boolean,
  doubleTime: boolean,
  chosenTags: string[]
): Promise<Map<string, TrackObject> | null> {
  const matchingTracks = new Map<string, TrackObject>();
  try {
    const playlists = await getAllFromStore("playlists");
    for (const playlist of playlists) {
      if (playlist.id == selectedPlaylist) {
        for (const track of playlist.tracks) {
          const trackFeatures: MetaBrainzFeatures = track.features;
          if (!trackFeatures.key || !trackFeatures.bpm || !trackFeatures.mode) {
            console.warn(`${track.track.id} is missing features.`);
          } else {
            const match: boolean = matches(
              trackFeatures,
              formValues,
              anyTempo,
              halfTime,
              doubleTime,
              chosenTags
            );
            if (match) {
              matchingTracks.set(track.track.id, track);
            }
          }
        }
      }
    }
    return matchingTracks;
  } catch (error) {
    showErrorNotif(
      "Error",
      "There was an error fetching playlists from the database."
    );
    console.error(`Error fetching tracks from IDB ${selectedPlaylist}`, error);
    return null;
  }
}

// Checks if a given track's features match values requested by the user
function matches(
  trackFeatures: MetaBrainzFeatures,
  formValues: FormValues,
  anyTempo: boolean,
  halfTime: boolean,
  doubleTime: boolean,
  chosenTags: string[]
): boolean {
  const {
    minTempo,
    maxTempo,
    key,
    mode,
    danceability,
    gender,
    acoustic,
    aggressive,
    electronic,
    happy,
    party,
    relaxed,
    sad,
    timbre,
  } = formValues;

  // Check tempo ranges
  if (!anyTempo) {
    const isInActualRange = checkActualRange();
    const isInHalfTimeRange = halfTime && checkTwinRange(0.5);
    const isInDoubleTimeRange = doubleTime && checkTwinRange(2);

    // Track passes if it's in the actual range OR in half/double time ranges (if selected)
    if (!(isInActualRange || isInHalfTimeRange || isInDoubleTimeRange)) {
      return false;
    }
  }
  function checkActualRange(): boolean {
    return trackFeatures.bpm >= minTempo && trackFeatures.bpm <= maxTempo;
  }

  function checkTwinRange(multiple: number): boolean {
    const minRange = minTempo * multiple;
    const maxRange = maxTempo * multiple;
    return trackFeatures.bpm >= minRange && trackFeatures.bpm <= maxRange;
  }

  if (key != "Any" && key !== trackFeatures.key) {
    return false;
  }

  if (mode != "Any" && mode.toLowerCase() !== trackFeatures.mode) {
    return false;
  }

  const keys: (keyof typeof formValues)[] = [
    "danceability",
    "gender",
    "acoustic",
    "aggressive",
    "electronic",
    "happy",
    "party",
    "relaxed",
    "sad",
    "timbre",
  ];

  for (const key of keys) {
    if (
      formValues[key] !== "Any" && // Access the variable by name
      convertToSnakeCase(formValues[key] as string) !==
        trackFeatures[key as keyof typeof trackFeatures]
    ) {
      return false;
    }
  }

  if (chosenTags) {
    for (const chosenTag of chosenTags) {
      if (!trackFeatures.tags.includes(chosenTag)) {
        return false;
      }
    }
  }

  return true;
}

function convertToSnakeCase(input: string): string {
  return input.toLowerCase().replace(/\s+/g, "_");
}

// Playlist
// Creates a new playlist on Spotify and then saves cadence playlist to it (2 separate post requests)
export async function savePlaylist(
  playlist: Map<string, TrackObject>,
  playlistData: PlaylistData
) {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  const user: string | null = getItemFromLocalStorage("user_data");
  if (!accessToken || !user) return null;

  const userId = JSON.parse(user).id;
  const playlistId: string | null = await createPlaylist(
    accessToken,
    playlistData,
    userId
  );

  // If playlist Id, request to create playlist was successful
  if (playlistId) {
    // Create songUris from playlist songs
    const songUris: string[] = Array.from(playlist).map(
      (track) => `spotify:track:${track[1].track.id}`
    );
    // Request adding songs to playlist
    return await addItemsToPlaylist(accessToken, playlistId, songUris);
  }
}

// Creates a playlist with title, description, and private/public
// Returns playlistId as a string
async function createPlaylist(
  accessToken: string,
  playlistData: PlaylistData,
  userId: string
): Promise<string | null> {
  try {
    const result = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      playlistData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return result.data.id;
  } catch (error) {
    console.error("Error creating playlist:", error);
    return null;
  }
}

// Adds songs to a playlist using an array of songUris (in format spotify:track:${song.id})
// Returns true for success, false for failure
async function addItemsToPlaylist(
  accessToken: string,
  playlistId: string,
  songUris: string[]
): Promise<boolean> {
  try {
    const res = await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        uris: songUris,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const snapshotId: string = res.data.snapshot_id;
    if (snapshotId) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error adding items to playlist:", error);
    return false;
  }
}
