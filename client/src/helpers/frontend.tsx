import axios from "axios";
import {
  User,
  Library,
  SavedTrack,
  Track,
  TrackFeatures,
  Artist,
} from "../types/types";
import { openDB, DBSchema, IDBPDatabase } from "idb";

interface MyDB extends DBSchema {
  library: {
    key: string; // track id
    value: {
      track: Track;
      features: TrackFeatures;
    };
  };
  topArtists: {
    key: string; // artist id
    value: Artist;
  };
  topTracks: {
    key: string; // track id
    value: Track;
  };
}

// Creates IndexedDB
export async function setUpDatabase(): Promise<IDBPDatabase<MyDB>> {
  // Opens the first version of the 'cadence' database.
  // If the database does not exist, it will be created.
  const db = await openDB<MyDB>("cadence", 1, {
    upgrade(db) {
      // Create an object store for songs
      if (!db.objectStoreNames.contains("library")) {
        db.createObjectStore("library", { keyPath: "id" });
      }

      // Create an object store for top artists
      if (!db.objectStoreNames.contains("topArtists")) {
        db.createObjectStore("topArtists", { keyPath: "id" });
      }

      // Create an object store for top tracks
      if (!db.objectStoreNames.contains("topTracks")) {
        db.createObjectStore("topTracks", { keyPath: "id" });
      }
    },
  });
  return db;
}

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
  const expiryTime = Date.now() + Number(expiresIn) * 1000;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("token_expiry", expiryTime.toString());
}

// Loads user's Spotify library
// Requires 3n/100 requests where n is the library size.
// (n/50 to get all songs + n/100 to get each song's features)
export async function loadUsersLibrary(): Promise<void> {
  const token = localStorage.getItem("access_token");
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

    // initialise array for storing song features
    const featuresLibrary = [];

    // Create array of chunks of 100 songs
    let n = 0;
    const chunks = [];
    while (n < library.length) {
      chunks.push(library.slice(n, Math.min(n + 100, library.length))); // Stop at the last index of the array if n + 100 > library length
      n += 100;
    }

    // for each chunk, request features for those songs
    for (const chunk of chunks) {
      // Get all the ids of the songs in the chunk
      const songIds = chunk.map((song) => song!.track.id);

      // fetch the features of the songs in the chunk
      const featuresResult = await axios.get(
        "https://api.spotify.com/v1/audio-features",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ids: songIds.join(","), // Join IDs as a comma-separated string
          },
        }
      );

      // add the features to the features library
      featuresLibrary.push(featuresResult.data.audio_features);
    }
    console.log("Song features were fetched:", featuresLibrary);
  } catch (error) {
    console.error(error);
  }
}

export async function getTopTracks() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.error("Access token not found.");
    return;
  }
  try {
    const res = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("top tracks:", res.data);
  } catch (error) {
    console.error("Error fetching top tracks:", error);
  }
}

export async function getTopArtists() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.error("Access token not found.");
    return;
  }
  try {
    const res = await axios.get(`https://api.spotify.com/v1/me/top/artists`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("top artists:", res.data);
  } catch (error) {
    console.error("Error fetching top artists:", error);
  }
}
