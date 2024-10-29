import axios from "axios";
import {
  Artist,
  FeaturesLibrary,
  Library,
  SavedTrack,
  TopArtists,
  Track,
  TrackFeatures,
  User,
} from "../types/types";
import { setInStore } from "./database";

// Fetch user data
export async function fetchUserData(
  token: string,
  setUser: (user: User) => void
): Promise<User | null> {
  try {
    const result = await axios.get<User>("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user: User = result.data;
    localStorage.setItem("user_data", JSON.stringify(user));
    setUser(user);
    return user;
  } catch (error) {
    console.error("There was an error fetching user data:", error);
    return null;
  }
}

// Get user's library size and stores it
export async function fetchUserLibrarySize(
  token: string,
  setLibSize: (size: number) => void
): Promise<number | null> {
  try {
    const result = await axios.get<Library>(
      "https://api.spotify.com/v1/me/tracks",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const librarySize: number = result.data.total;
    localStorage.setItem("lib_size", librarySize.toString());
    setLibSize(librarySize);
    return librarySize;
  } catch (error) {
    console.error("There was an error fetching the user's library:", error);
    return null;
  }
}

// Checks whether user has just logged in
export function loginOccurred(): boolean {
  const hash = window.location.hash;
  const accessToken: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("access_token");
  const refreshToken: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("refresh_token");
  const expiresIn: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("expires_in");

  if (accessToken && refreshToken && expiresIn) {
    return true;
  } else {
    return false;
  }
}

// Checks if user is logged in by checking if user_data is in local storage
export function getUserFromLocalStorage(): User | null {
  const storedUserData = localStorage.getItem("user_data");
  if (storedUserData) {
    return JSON.parse(storedUserData);
  } else {
    return null;
  }
}

export function getLibSizeFromLocalStorage(): number | null {
  const libSize = localStorage.getItem("lib_size");
  if (libSize) {
    return Number(libSize);
  } else {
    return null;
  }
}

// Retrieves and returns access token from local storage
export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

// Gets tokens from URL when user has logged in and sets them in state/local storage
// Also sets user data and library size
export function handleLogin(
  setLibSize: (size: number) => void,
  setUser: (user: User) => void
): void {
  const hash = window.location.hash;
  const accessToken: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("access_token");
  const refreshToken: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("refresh_token");
  const expiresIn: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("expires_in");

  if (accessToken && refreshToken && expiresIn) {
    storeTokens(accessToken, refreshToken, expiresIn);
    window.location.hash = "";
    fetchUserLibrarySize(accessToken, setLibSize);
    fetchUserData(accessToken, setUser);
  }
}

// Store tokens in local storage
export function storeTokens(
  access: string,
  refresh: string,
  expiresIn: string
): void {
  console.log("Storing tokens:", access, refresh, expiresIn);
  const expiryTime = Date.now() + Number(expiresIn) * 1000;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("token_expiry", expiryTime.toString());
}

// Loads user's Spotify library
// Requires n/50 requests where n is the library size.

export async function loadUsersLibrary(): Promise<SavedTrack[] | null> {
  console.log("Loading your library");
  const token = getAccessToken();
  if (!token) {
    console.error("Error fetching user's library: Access token not found.");
    return null;
  }
  let library: SavedTrack[] = [];
  let nextUrl = "https://api.spotify.com/v1/me/tracks?limit=50";

  try {
    while (nextUrl) {
      const libraryResult = await axios.get<Library>(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      library = [...library, ...libraryResult.data.items];
      nextUrl = libraryResult.data.next;
    }

    // Log songs fetched to console to check they're all there.
    console.log("Your library was fetched: ", library.length);
    return library;
  } catch (error) {
    console.error("Error fetching user's library: ", error);
    return null;
  }
}

// Fetches user library song features 100 at a time
// Requires n/100 requests where n is lib size
export async function loadUsersLibraryFeatures(
  library: SavedTrack[]
): Promise<TrackFeatures[] | null> {
  console.log("Loading your library features");

  const token = getAccessToken();
  if (!token) {
    console.error("Error fetching library features: access token not found.");
    return null;
  }

  // initialise array for storing song features
  const featuresLibrary: TrackFeatures[] = [];

  // Break library into chunks of 100 songs
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
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ids: songIds.join(","), // Join IDs as a comma-separated string
          },
        }
      );

      // add the features to the features library
      featuresLibrary.push(...featuresResult.data.audio_features);
    } catch (error) {
      console.error("Error fetching library features: ", error);
      return null;
    }
  }
  console.log("Library features loaded");
  return featuresLibrary;
}

// Populates the library in IndexedDB
export async function storeUserLibraryAndFeatures(
  library: SavedTrack[],
  featuresLibrary: TrackFeatures[]
): Promise<boolean> {
  console.log("Storing songs and their features..");
  let success = true;

  for (const track of library) {
    const trackId = track.track.id;
    const trackFeatures = featuresLibrary.find(
      (features) => features.id === trackId
    ); // Find corresponding features

    if (trackFeatures) {
      // Save the track and its features to IndexedDB
      try {
        await setInStore("library", {
          track: track.track,
          features: trackFeatures,
        });
      } catch (error) {
        console.error(`Error storing track ${trackId} in IndexedDB:`, error);
        success = false;
      }
    } else {
      console.warn(`No features found for track ID ${trackId}`);
      success = false;
    }
  }

  if (success) {
    console.log("All tracks successfully stored in IDB");
  } else {
    console.warn("Some or all tracks could not be stored in IndexedDB");
  }

  return success;
}

export async function storeUserTopTrackData(
  topTracks: Track[],
  topTrackFeatures: TrackFeatures[]
): Promise<boolean> {
  console.log("Storing top tracks and their features..");
  let success = true;

  for (const [index, track] of topTracks.entries()) {
    const trackId = track.id;
    const trackFeatures = topTrackFeatures.find(
      (features) => features.id === trackId
    ); // Find corresponding features

    if (trackFeatures) {
      // Save the track and its features to IndexedDB
      try {
        await setInStore("topTracks", {
          track: track,
          features: trackFeatures,
          order: index, // Add order based on position in the topTracks array
        });
      } catch (error) {
        console.error(`Error storing track ${trackId} in IndexedDB:`, error);
        success = false;
      }
    } else {
      console.warn(`No features found for track ID ${trackId}`);
      success = false;
    }
  }

  if (success) {
    console.log("All tracks successfully stored in IDB");
  } else {
    console.warn("Some or all tracks could not be stored in IndexedDB");
  }

  return success;
}

export async function fetchAndStoreLibraryData(): Promise<boolean | null> {
  const lib: SavedTrack[] | null = await loadUsersLibrary();

  if (lib) {
    const feats: TrackFeatures[] | null = await loadUsersLibraryFeatures(lib);

    if (feats) {
      const success = storeUserLibraryAndFeatures(lib, feats);
      return success;
    } else {
      console.error("Error loading user's library features.");
      return null;
    }
  } else {
    console.error("Error loading the user's library");
    return null;
  }
}

// Fetches user's top tracks from last 6 months (medium_term)
export async function getTopTracks(): Promise<Track[] | null> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.error("Access token not found.");
    return null;
  }
  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("top tracks from spotify:", res.data);
    return res.data.items;
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return null;
  }
}

export async function getTopTrackFeatures(
  topTracks: Track[]
): Promise<TrackFeatures[] | null> {
  const token = getAccessToken();
  if (!token) {
    console.error("Error fetching top track features: access token not found.");
    return null;
  }

  const songIds = topTracks.map((song) => song!.id);

  try {
    const featuresResult = await axios.get<FeaturesLibrary>(
      "https://api.spotify.com/v1/audio-features",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ids: songIds.join(","), // Join IDs as a comma-separated string
        },
      }
    );

    const topTrackFeatures: TrackFeatures[] | null =
      featuresResult.data.audio_features;
    return topTrackFeatures;
  } catch (error) {
    console.error("Error fetching library features: ", error);
    return null;
  }
}

export async function fetchAndStoreTopTrackData(): Promise<boolean | null> {
  const topTracks: Track[] | null = await getTopTracks();

  if (topTracks) {
    const topTrackFeatures: TrackFeatures[] | null = await getTopTrackFeatures(
      topTracks
    );

    if (topTrackFeatures) {
      const success = storeUserTopTrackData(topTracks, topTrackFeatures);
      return success;
    } else {
      console.error("Error loading user's library features.");
      return null;
    }
  } else {
    console.error("Error loading the user's library");
    return null;
  }
}

// Fetches user's top 5 artists from last 6 months (medium_term)
export async function getTopArtists(): Promise<Artist[] | null> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.error("Access token not found.");
    return null;
  }
  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/me/top/artists?limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("top artists:", res.data);
    const topArtists: Artist[] = res.data.items;
    return topArtists;
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return null;
  }
}

export async function storeTopArtistsInDatabase(): Promise<boolean | null> {
  let success = true;
  const topArtists: Artist[] | null = await getTopArtists();
  if (topArtists) {
    for (const artist of topArtists) {
      try {
        await setInStore("topArtists", artist);
      } catch (error) {
        console.error(`Error storing artist in IndexedDB:`, error);
        success = false;
      }
    }
  } else {
    console.warn(`No artists found`);
    success = false;
  }
  return success;
}

export function isLibraryStoredInDB(): boolean {
  const stored: string | null = localStorage.getItem("library_was_stored");
  if (stored === "true") {
    return true;
  } else {
    return false;
  }
}

export function areTopTracksStoredInDB(): boolean {
  const stored: string | null = localStorage.getItem("top_tracks_were_stored");
  if (stored === "true") {
    return true;
  } else {
    return false;
  }
}

export function areTopArtistsStoredInDB(): boolean {
  const stored: string | null = localStorage.getItem("top_artists_were_stored");
  if (stored === "true") {
    return true;
  } else {
    return false;
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_expiry");
  localStorage.removeItem("user_data");
  localStorage.removeItem("lib_size");
  localStorage.removeItem("library_was_stored");
  localStorage.removeItem("top_tracks_were_stored");
}
