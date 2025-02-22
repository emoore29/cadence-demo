import { SearchResult } from "@/types/deezer/search";
import axios from "axios";
import { chunk } from "lodash";
import {
  AcousticBrainzData,
  Artist,
  Library,
  MusicBrainzData,
  SavedTrack,
  TopTracks,
  Track,
  TrackObject,
  User,
} from "../types/types";
import { deleteFromStore, setInStore } from "./database";
import { showErrorNotif, showWarnNotif } from "./general";
import { getItemFromLocalStorage } from "./localStorage";

// Fetches user data, returns User or null on failure
export async function fetchUserData(): Promise<User | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  try {
    const res = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (error) {
    showErrorNotif("Error", "There was an error fetching your user data.");
    return null;
  }
}

// Fetches library size, returns number or null on failure
export async function fetchLibrarySize(): Promise<number | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  try {
    const res = await axios.get<Library>(
      "https://api.spotify.com/v1/me/tracks",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return Number(res.data.total);
  } catch (error) {
    showErrorNotif("Error", "There was an error fetching your library size.");
    return null;
  }
}

// Fetches user's saved tracks
// Returns SavedTrack[] or null on failure
export async function fetchSavedTracks(
  updateProgressBar: () => void
): Promise<SavedTrack[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  let savedTracks: SavedTrack[] = [];
  let nextUrl = "https://api.spotify.com/v1/me/tracks?limit=50";
  try {
    // Total limit is 1000 to prevent extremely long load times
    while (nextUrl && savedTracks.length < 1000) {
      const res = await axios.get<Library>(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      savedTracks = [...savedTracks, ...res.data.items];
      updateProgressBar();
      nextUrl = res.data.next;
    }
    return savedTracks;
  } catch (error) {
    showErrorNotif("Error", "There was an error fetching your saved tracks.");
    return null;
  }
}

export async function searchTrackDeezer(
  trackName: string,
  trackArtist: string
): Promise<string | null> {
  // Search for a track with name and artist, return preview_url if available
  try {
    const res = await axios.get<SearchResult>(
      `https://api.deezer.com/search?q=artist:"${trackArtist}"track:"${trackName}"`
    );
    const numResults: number = res.data.total;
    if (numResults == 0) {
      console.warn(
        `Could not find Deezer track for ${trackName} by ${trackArtist}`
      );
      return null;
    }
    const preview: string = res.data.data[0].preview;
    return preview;
  } catch (error) {
    console.error(`Error searching for track in Deezer.`, error);
    return null;
  }
}

export async function fetchMbData(
  isrcArr: string[]
): Promise<MusicBrainzData | null> {
  const isrcs: string = isrcArr.join(",");

  try {
    const res = await fetch(
      `/api/musicbrainz/mbid?isrcs=${encodeURIComponent(isrcs)}`
    );
    const data = await res.json();
    return data.mbData;
  } catch (error) {
    console.warn(`Could not retrieve mbids for track isrcs: ${isrcs}`);
    return null;
  }
}

export async function fetchFeatures(
  mbidArr: string[]
): Promise<AcousticBrainzData | null> {
  const mbids: string = mbidArr.join(",");

  try {
    const response = await fetch(
      `/api/acousticbrainz/features?mbids=${encodeURIComponent(mbids)}`
    );
    const data = await response.json();
    const features: AcousticBrainzData = data.features;
    if (features) {
      return features;
    } else {
      console.warn("No features response from server");
      return null;
    }
  } catch (error) {
    console.warn(`Could not retrieve features`);
    return null;
  }
}

// Fetches user's top 500 tracks from last 12 months
// Returns Track[] or null on failure
export async function fetchTopTracks(
  updateProgressBar: () => void
): Promise<Track[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  let topTracks: Track[] = [];
  let nextUrl =
    "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50";
  try {
    while (nextUrl && topTracks.length < 500) {
      const res = await axios.get<TopTracks>(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      topTracks = [...topTracks, ...res.data.items];
      nextUrl = res.data.next;
      updateProgressBar();
    }
    return topTracks;
  } catch (error) {
    showErrorNotif("Error", "There was an error fetching your top tracks.");
    return null;
  }
}

// Fetches user's top 50 artists from last 12 months (long_term)
// Returns Artist[] or null if failed to fetch
export async function fetchTopArtists(
  updateProgressBar: () => void
): Promise<Artist[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    updateProgressBar();
    return res.data.items;
  } catch (error) {
    showErrorNotif("Error", "There was an error fetching your top artists.");
    return null;
  }
}

// Checks if the tracks are currently saved in the user's Spotify library
// Adds saved property reflecting Spotify saved status to each track
// NOTE: In demo, "Saved Songs" are not the user's Saved Songs.
// So the more they create playlists and sync Cadence with their Spotify library,
// the more tracks that will be removed from IDB - eventually there will be very few demo tracks left,
// assuming the user's saved tracks do not overlap with the demo tracks significantly.
export async function syncTracksSavedStatus(
  tracks: Map<string, TrackObject>
): Promise<Map<string, TrackObject> | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;

  const tracksArray: TrackObject[] = Array.from(tracks.values());
  const chunks = chunk(tracksArray, 50);
  let results: boolean[] = []; // Initialise results array - true if track is saved in Spotify, false if not

  for (const chunk of chunks) {
    const ids = chunk.map((song) => song!.track.id);
    try {
      const res = await axios.get<boolean[]>(
        "https://api.spotify.com/v1/me/tracks/contains",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            ids: ids.join(","),
          },
        }
      );
      results.push(...res.data);
    } catch (error) {
      showWarnNotif(
        "Error",
        "There was an error syncing playlist tracks' saved status with Spotify."
      );
      return null;
    }
  }

  // The indexes of matchingTracks and results should align
  let index = 0;
  for (const track of tracks.values()) {
    track.saved = results[index++]; // Update the track.saved status to reflect true/false returned from Spotify
  }
  // Return matchingTracks with updated saved statuses
  return tracks;
}

// Updates track's saved status in Spotify & IDB
export async function updateSavedStatus(
  trackObj: TrackObject,
  saved: boolean
): Promise<string | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) {
    showErrorNotif("No access token", "Please sign in to access this feature.");
    return null;
  }

  // Check if track is saved in IDB
  // Note: if user has deleted it via Spotify,
  // and it is still recorded as saved in Cadence,
  // this will still send a delete request to Spotify.
  // No error occurs, but it's still necessary to check as there's no way to know
  // if the user has deleted it via Spotify.
  if (saved) {
    try {
      await axios.delete("https://api.spotify.com/v1/me/tracks", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          ids: trackObj.track.id,
        },
      }); // Spotify sends an empty response but 200 means success

      // Remove from IDB
      await deleteFromStore("savedTracks", trackObj.track.id);
      return "Removed";
    } catch (error) {
      showErrorNotif(
        "Error",
        "There was an error removing track from Spotify."
      );
      return null;
    }
  } else {
    try {
      await axios.put("https://api.spotify.com/v1/me/tracks", null, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          ids: trackObj.track.id,
        },
      });

      // Add to IDB
      await setInStore("savedTracks", trackObj);
      return "Added";
    } catch (error) {
      showErrorNotif("Error", "There was an error adding track to Spotify.");
      return null;
    }
  }
}

export async function searchForArtist(
  userInput: string,
  abortController: React.MutableRefObject<AbortController | undefined>,
  abortSignal: AbortSignal,
  setData: React.Dispatch<React.SetStateAction<Track[] | Artist[] | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<boolean> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) {
    setLoading(false);
    abortController.current = undefined;
    return false;
  }

  const artistQuery = encodeURIComponent(userInput);

  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/search?q=${artistQuery}&type=artist&limit=20`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: abortSignal,
      }
    );

    console.log("got a result back");
    setData(res.data.artists.items);
    setLoading(false);
    abortController.current = undefined;

    return true;
  } catch (error) {
    // showErrorNotif("Error", "Something went wrong getting available artists.");
    setLoading(false);
    abortController.current = undefined;
    return false;
  }
}

export async function searchForTrack(
  userInput: string,
  abortController: React.MutableRefObject<AbortController | undefined>,
  abortSignal: AbortSignal,
  setData: React.Dispatch<React.SetStateAction<Track[] | Artist[] | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<Track[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;

  const trackQuery = encodeURIComponent(userInput); // convert whitespace to %20

  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/search?q=${trackQuery}&type=track&limit=20`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: abortSignal,
      }
    );

    setData(res.data.tracks.items);
    setLoading(false);
    abortController.current = undefined;

    return res.data.tracks.items;
  } catch (error) {
    return null;
  }
}
