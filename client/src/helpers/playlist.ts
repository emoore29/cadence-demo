import { getAllFromStore } from "@/helpers/database";
import {
  ChosenSeeds,
  FormValues,
  MetaBrainzFeatures,
  NumericFeatures,
  PlaylistData,
  StoreName,
  TrackFeatures,
  TrackObject,
} from "@/types/types";
import axios from "axios";
import { showErrorNotif } from "./general";
import { getItemFromLocalStorage } from "./localStorage";

export async function startSearch(
  formValues: FormValues,
  anyTempo: boolean,
  activeSourceTab: string | null,
  chosenSeeds?: ChosenSeeds
): Promise<Map<string, TrackObject> | null | void> {
  const store: string = formValues.source;
  if (activeSourceTab === "mySpotify") {
    switch (store) {
      case "1":
        return await filterFromStore("savedTracks", formValues, anyTempo);

      case "2":
        return await filterFromStore("topTracks", formValues, anyTempo);

      default:
        return null;
    }
  }
}

// Gets songs matching filters from saved songs or top songs library
// Returns array of matching tracks
export async function filterFromStore(
  storeName: StoreName,
  formValues: FormValues,
  anyTempo: boolean
): Promise<Map<string, TrackObject> | null> {
  const matchingTracks = new Map<string, TrackObject>();

  try {
    const tracks = await getAllFromStore(storeName);
    for (const track of tracks) {
      console.log(track);
      const trackFeatures: MetaBrainzFeatures = track.features;
      if (!trackFeatures.key || !trackFeatures.bpm || !trackFeatures.mode) {
        console.warn(`${track.track.name} is missing features.`);
      } else {
        const match: boolean = matches(trackFeatures, formValues, anyTempo);
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

function convertToNumber(level: string): number | null {
  switch (level) {
    case "Any":
      return null;
    case "Low":
      return 0.333;
    case "Medium":
      return 0.666;
    case "High":
      return 1;
    default:
      return null;
  }
}

// Checks if a given track's features match values requested by the user
function matches(
  trackFeatures: MetaBrainzFeatures,
  formValues: FormValues,
  anyTempo: boolean
): boolean {
  const { minTempo, maxTempo, key, mode } = formValues;

  if (
    !anyTempo &&
    (trackFeatures.bpm <= minTempo || trackFeatures.bpm >= maxTempo)
  ) {
    return false;
  }

  console.log("filter key", key);
  console.log("track key", trackFeatures.key[0]);
  console.log("track mode", trackFeatures.mode);

  if (key != "Any" && key != trackFeatures.key[0]) {
    return false;
  }

  if (mode != "Any" && mode.toLowerCase() != trackFeatures.mode) {
    return false;
  }

  return true;
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
    return true;
  } catch (error) {
    console.error("Error adding items to playlist:", error);
    return false;
  }
}
