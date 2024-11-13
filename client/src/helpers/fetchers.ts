import axios from "axios";
import {
  Artist,
  FeaturesLibrary,
  Library,
  NumericFilters,
  Recommendations,
  SavedTrack,
  TopTracks,
  Track,
  TrackFeatures,
  TrackObject,
  User,
} from "../types/types";
import { deleteFromStore, setInStore } from "./database";
import { showErrorNotif, showWarnNotif } from "./general";
import { getTop5ArtistIds, getTop5TrackIds } from "./indexedDbHelpers";
import { getItemFromLocalStorage } from "./localStorage";

// Fetches user data
// Returns User
export async function fetchUserData(): Promise<User | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (accessToken) {
    try {
      const res = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    } catch (error) {
      showErrorNotif("Error", "There was an error fetching your user data.");
      console.error("Error details: ", error);

      return null;
    }
  } else {
    return null;
  }
}

// Fetches library size
// Returns number
export async function fetchLibrarySize(): Promise<number | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (accessToken) {
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
      console.error("Error details: ", error);

      return null;
    }
  } else {
    return null;
  }
}

// Fetches user's saved tracks 50 at a time
// Returns SavedTrack[] or null if failed to fetch
export async function fetchSavedTracks(): Promise<SavedTrack[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (accessToken) {
    let library: SavedTrack[] = [];
    let nextUrl = "https://api.spotify.com/v1/me/tracks?limit=50";
    try {
      while (nextUrl) {
        const libraryResult = await axios.get<Library>(nextUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        library = [...library, ...libraryResult.data.items];
        nextUrl = libraryResult.data.next;
      }

      // Log songs fetched to console to check they're all there.
      console.log("Your library was fetched: ", library.length);
      return library;
    } catch (error) {
      showErrorNotif("Error", "There was an error fetching your saved tracks.");
      console.error("Error details: ", error);
      return null;
    }
  } else {
    return null;
  }
}

// Fetches user's saved track song features 100 at a time
// Takes SavedTrack[]
// Returns TrackFeatures[] or null if failed to fetch
export async function fetchSavedTracksFeatures(
  library: SavedTrack[]
): Promise<TrackFeatures[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  const featuresLibrary: TrackFeatures[] = [];

  // Break library into chunks of 100 songs for fetching 100 at a time
  let n = 0;
  const chunks = [];
  while (n < library.length) {
    chunks.push(library.slice(n, Math.min(n + 100, library.length))); // Stop at the last index of the array if n + 100 > library length
    n += 100;
  }

  // For each chunk, request features for those songs
  for (const chunk of chunks) {
    // Get all the ids of the songs in the chunk
    const songIds = chunk.map((song) => song!.track.id);
    try {
      const featuresResult = await axios.get<FeaturesLibrary>(
        "https://api.spotify.com/v1/audio-features",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            ids: songIds.join(","), // Join IDs as a comma-separated string
          },
        }
      );

      // add the features to the features library
      featuresLibrary.push(...featuresResult.data.audio_features);
    } catch (error) {
      showErrorNotif(
        "Error",
        "There was an error fetching your library features."
      );
      console.error("Error details: ", error);
      return null;
    }
  }
  console.log("Library features loaded");
  return featuresLibrary;
}

// Fetches user's top 500 tracks from last 12 months (long_term)
// Returns Track[] or null if failed to fetch
export async function fetchTopTracks(): Promise<Track[] | null> {
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
    }

    // Log songs fetched to console to check they're all there.
    console.log("Your top 500 tracks were fetched: ", topTracks);
    return topTracks;
  } catch (error) {
    showErrorNotif("Error", "There was an error fetching your top tracks.");
    console.error("Error details: ", error);
    return null;
  }
}

// Fetches user's top track features
// Takes a Track[] of user's top tracks
// Returns TrackFeatures[] or null if failed to fetch
export async function fetchTopTrackFeatures(
  topTracks: Track[]
): Promise<TrackFeatures[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;

  const featuresTopTracks: TrackFeatures[] = [];

  // Break top tracks into chunks of 100 songs for fetching 100 at a time
  let n = 0;
  const chunks = [];
  while (n < topTracks.length) {
    chunks.push(topTracks.slice(n, Math.min(n + 100, topTracks.length))); // Stop at the last index of the array if n + 100 > library length
    n += 100;
  }

  // For each chunk, request features for those songs
  for (const chunk of chunks) {
    // Get all the ids of the songs in the chunk
    const songIds = chunk.map((song) => song!.id);
    try {
      const featuresResult = await axios.get<FeaturesLibrary>(
        "https://api.spotify.com/v1/audio-features",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            ids: songIds.join(","), // Join IDs as a comma-separated string
          },
        }
      );

      // add the features to the features library
      featuresTopTracks.push(...featuresResult.data.audio_features);
    } catch (error) {
      showErrorNotif(
        "Error",
        "There was an error fetching your top track features."
      );
      console.error("Error details: ", error);
      return null;
    }
  }

  return featuresTopTracks;
}

// Fetches user's top 5 artists from last 12 months (long_term)
// Returns Artist[] or null if failed to fetch
export async function fetchTopArtists(): Promise<Artist[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;

  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.items;
  } catch (error) {
    showErrorNotif("Error", "There was an error fetching your top artists.");
    console.error("Error details: ", error);
    return null;
  }
}

// Converts filter keys to snake case and values to strings for adding to URL query params
function parseFilters(filters: NumericFilters) {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([key, value]) => value != undefined)
      .map(([key, value]) => [
        key.replace(/([A-Z])/g, "_$1").toLowerCase(),
        String(value), // Convert all values to strings
      ])
  );
}

// Fetches X number of recommended tracks + their features based on user's top tracks and artists
// Returns Map<string, TrackObject> containing recommended songs and their features
export async function fetchRecommendations(
  filters: NumericFilters,
  target: number
): Promise<Map<string, TrackObject> | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  const topTracks: string[] | null = await getTop5TrackIds();
  const topArtists: string[] | null = await getTop5ArtistIds();
  if (!accessToken || !topTracks || !topArtists) return null;

  // Get top artist and track ids for recommendation API
  const trackIds: string = topTracks.slice(0, 1).join(",");
  const artistIds: string = topArtists.slice(0, 4).join(",");

  // Init Map for storing recommendations
  let recommendations: Map<string, TrackObject> = new Map();

  // Convert filter values to strings for URL params
  const params = new URLSearchParams({
    ...parseFilters(filters),
    limit: String(target),
    seed_artists: artistIds,
    seed_tracks: trackIds,
  });

  // Initialise arrays for storing request results
  let recommendedTracks: Track[];
  let recommendedTrackFeatures: TrackFeatures[];

  // Get recommended tracks based on filters
  try {
    const res = await axios.get<Recommendations>(
      `https://api.spotify.com/v1/recommendations?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    recommendedTracks = res.data.tracks;
  } catch (error) {
    showErrorNotif("Error", "There was an error fetching recommendations.");
    console.error("Error details: ", error);
    return null;
  }

  // Get ids of recommended tracks
  const songIds = recommendedTracks.map((song) => song!.id);

  // Get recommended tracks' features
  try {
    const res = await axios.get<FeaturesLibrary>(
      "https://api.spotify.com/v1/audio-features",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          ids: songIds.join(","), // Join IDs as a comma-separated string
        },
      }
    );
    recommendedTrackFeatures = res.data.audio_features;
  } catch (error) {
    showErrorNotif(
      "Error",
      "There was an error fetching recommended track features."
    );
    console.error("Error details: ", error);
    return null;
  }

  // Create TrackObjects from recommendedTracks and recommendedTrackFeatures, and set in recommendations Map
  for (const track of recommendedTracks) {
    const features = recommendedTrackFeatures.find((f) => f.id === track.id);
    if (features) {
      recommendations.set(track.id, {
        track: track,
        features: features,
      });
    } else {
      console.warn(`No features found for track ID ${track.id}`);
    }
  }
  return recommendations;
}

// Given a Map<string, TrackObject>, checks if the tracks are currently saved in the user's Spotify library
// Returns Map<string, TrackObject> with saved property added to each TrackObject
export async function checkSavedTracks(
  tracks: Map<string, TrackObject>
): Promise<Map<string, TrackObject> | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;

  const tracksArray: TrackObject[] = Array.from(tracks.values());
  // Break library into chunks of 50 songs for checking 50 at a time
  let n = 0;
  const chunks = [];
  while (n < tracksArray.length) {
    chunks.push(tracksArray.slice(n, Math.min(n + 50, tracksArray.length))); // Stop at the last index of the array if n + 50 > library length
    n += 50;
  }

  const booleanRes: boolean[] = [];

  // For each chunk, check if the songs are saved
  for (const chunk of chunks) {
    const songIds = chunk.map((song) => song!.track.id);
    try {
      const res = await axios.get<boolean[]>(
        "https://api.spotify.com/v1/me/tracks/contains",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            ids: songIds.join(","), // Join IDs as a comma-separated string
          },
        }
      );
      booleanRes.push(...res.data);
    } catch (error) {
      showWarnNotif(
        "Error",
        "There was an error verifying if the playlist tracks are saved in your Spotify library."
      );
      console.error("Error details: ", error);
      return null;
    }
  }

  // Boolean array as res, e.g. [true, false, true, true, true, false]
  // Loop through tracks and booleanRes, adding the result to each track
  let index = 0;
  for (const [trackId, track] of tracks.entries()) {
    track.saved = booleanRes[index++];
  }
  return tracks;
}

// Updates track's saved status in Spotify & IDB
export async function updateSavedStatus(
  trackObj: TrackObject,
  saved: boolean
): Promise<string | null> {
  // TODO: Update IDB as well as Spotify
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;

  // If track is recorded as saved in Cadence
  // Note: if user has deleted it via Spotify,
  // and it is still recorded as saved in Cadence,
  // this will still send a delete request to Spotify.
  // No error occurs, however it's a redundant request and probably needs rethinking.
  if (saved) {
    try {
      const res = await axios.delete("https://api.spotify.com/v1/me/tracks", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          ids: trackObj.track.id, // Join IDs as a comma-separated string
        },
      });

      // Remove from IDB
      await deleteFromStore("library", trackObj.track.id);
      console.log(`Removed ${trackObj.track.name} from spotify saved tracks`);

      return "Removed";
    } catch (error) {
      showErrorNotif(
        "Error",
        "There was an error removing track from Spotify."
      );
      console.error("Error details: ", error);
      return null;
    }
  } else {
    try {
      const res = await axios.put(
        "https://api.spotify.com/v1/me/tracks",
        null,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            ids: trackObj.track.id, // Join IDs as a comma-separated string
          },
        }
      );

      // Add to idb
      await setInStore("library", trackObj);
      console.log(`Added ${trackObj.track.name} to spotify saved tracks`);

      return "Added";
    } catch (error) {
      showErrorNotif("Error", "There was an error adding track to Spotify.");
      console.error("Error details: ", error);
      return null;
    }
  }
}
