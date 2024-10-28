import axios from "axios";
import {
  User,
  Library,
  SavedTrack,
  TrackFeatures,
  FeaturesLibrary,
  Track,
} from "../types/types";
import { setInStore, setUpDatabase } from "./database";
import { SampleTrack } from "../types/types";

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
// Requires n/50 requests where n is the library size.

export async function loadUsersLibrary(): Promise<SavedTrack[] | null> {
  console.log("Loading your library");
  const token = getAccessToken();
  if (!token) {
    console.error("Access token not found.");
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
    console.error(error);
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
    console.error("Access token not found.");
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
      console.error("There was an error fetching song features", error);
      return null;
    }
  }
  console.log("Your library features were loaded");
  return featuresLibrary;
}

// Populates the library in IndexedDB
export async function storeUserLibraryAndFeatures(
  library: SavedTrack[],
  featuresLibrary: TrackFeatures[]
): Promise<void> {
  console.log("Storing songs and their features..");
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
      }
    } else {
      console.warn(`No features found for track ID ${trackId}`);
    }
  }

  console.log("Library and features successfully stored in IndexedDB.");
}

export async function fetchAndStoreLibraryData() {
  const lib = await loadUsersLibrary();
  const feats = lib && (await loadUsersLibraryFeatures(lib));
  lib && feats && storeUserLibraryAndFeatures(lib, feats);
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

export async function getAndStoreSampleTrack() {
  const sampleTrack: Track = {
    album: {
      album_type: "ALBUM",
      artists: [
        {
          external_urls: {
            spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02",
          },
          href: "https://api.spotify.com/v1/artists/06HL4z0CvFAxyc27GXpf02",
          id: "06HL4z0CvFAxyc27GXpf02",
          name: "Taylor Swift",
          type: "artist",
          uri: "spotify:artist:06HL4z0CvFAxyc27GXpf02",
        },
      ],
      available_markets: [
        "AR",
        "AU",
        "AT",
        "BE",
        "BO",
        "BR",
        "BG",
        "CA",
        "CL",
        "CO",
        "CR",
        "CY",
        "CZ",
        "DK",
        "DO",
        "DE",
        "EC",
        "EE",
        "SV",
        "FI",
        "FR",
        "GR",
        "GT",
        "HN",
        "HK",
        "HU",
        "IS",
        "IE",
        "IT",
        "LV",
        "LT",
        "LU",
        "MY",
        "MT",
        "MX",
        "NL",
        "NZ",
        "NI",
        "NO",
        "PA",
        "PY",
        "PE",
        "PH",
        "PL",
        "PT",
        "SG",
        "SK",
        "ES",
        "SE",
        "CH",
        "TW",
        "TR",
        "UY",
        "US",
        "GB",
        "AD",
        "LI",
        "MC",
        "ID",
        "TH",
        "VN",
        "RO",
        "IL",
        "ZA",
        "SA",
        "AE",
        "BH",
        "QA",
        "OM",
        "KW",
        "EG",
        "MA",
        "DZ",
        "TN",
        "LB",
        "JO",
        "PS",
        "IN",
        "BY",
        "KZ",
        "MD",
        "UA",
        "AL",
        "BA",
        "HR",
        "ME",
        "MK",
        "RS",
        "SI",
        "KR",
        "BD",
        "PK",
        "LK",
        "GH",
        "KE",
        "NG",
        "TZ",
        "UG",
        "AG",
        "AM",
        "BS",
        "BB",
        "BZ",
        "BT",
        "BW",
        "BF",
        "CV",
        "CW",
        "DM",
        "FJ",
        "GM",
        "GE",
        "GD",
        "GW",
        "GY",
        "HT",
        "JM",
        "KI",
        "LS",
        "LR",
        "MW",
        "MV",
        "ML",
        "MH",
        "FM",
        "NA",
        "NR",
        "NE",
        "PW",
        "PG",
        "WS",
        "SM",
        "ST",
        "SN",
        "SC",
        "SL",
        "SB",
        "KN",
        "LC",
        "VC",
        "SR",
        "TL",
        "TO",
        "TT",
        "TV",
        "VU",
        "AZ",
        "BN",
        "BI",
        "KH",
        "CM",
        "TD",
        "KM",
        "GQ",
        "SZ",
        "GA",
        "GN",
        "KG",
        "LA",
        "MO",
        "MR",
        "MN",
        "NP",
        "RW",
        "TG",
        "UZ",
        "ZW",
        "BJ",
        "MG",
        "MU",
        "MZ",
        "AO",
        "CI",
        "DJ",
        "ZM",
        "CD",
        "CG",
        "IQ",
        "LY",
        "TJ",
        "VE",
        "ET",
        "XK",
      ],
      external_urls: {
        spotify: "https://open.spotify.com/album/2Xoteh7uEpea4TohMxjtaq",
      },
      href: "https://api.spotify.com/v1/albums/2Xoteh7uEpea4TohMxjtaq",
      id: "2Xoteh7uEpea4TohMxjtaq",
      images: [
        {
          height: 640,
          url: "https://i.scdn.co/image/ab67616d0000b27333b8541201f1ef38941024be",
          width: 640,
        },
        {
          height: 300,
          url: "https://i.scdn.co/image/ab67616d00001e0233b8541201f1ef38941024be",
          width: 300,
        },
        {
          height: 64,
          url: "https://i.scdn.co/image/ab67616d0000485133b8541201f1ef38941024be",
          width: 64,
        },
      ],
      name: "evermore",
      release_date: "2020-12-11",
      release_date_precision: "day",
      total_tracks: 15,
      type: "album",
      uri: "spotify:album:2Xoteh7uEpea4TohMxjtaq",
    },
    artists: [
      {
        external_urls: {
          spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02",
        },
        href: "https://api.spotify.com/v1/artists/06HL4z0CvFAxyc27GXpf02",
        id: "06HL4z0CvFAxyc27GXpf02",
        name: "Taylor Swift",
        type: "artist",
        uri: "spotify:artist:06HL4z0CvFAxyc27GXpf02",
      },
    ],
    available_markets: [
      "AR",
      "AU",
      "AT",
      "BE",
      "BO",
      "BR",
      "BG",
      "CA",
      "CL",
      "CO",
      "CR",
      "CY",
      "CZ",
      "DK",
      "DO",
      "DE",
      "EC",
      "EE",
      "SV",
      "FI",
      "FR",
      "GR",
      "GT",
      "HN",
      "HK",
      "HU",
      "IS",
      "IE",
      "IT",
      "LV",
      "LT",
      "LU",
      "MY",
      "MT",
      "MX",
      "NL",
      "NZ",
      "NI",
      "NO",
      "PA",
      "PY",
      "PE",
      "PH",
      "PL",
      "PT",
      "SG",
      "SK",
      "ES",
      "SE",
      "CH",
      "TW",
      "TR",
      "UY",
      "US",
      "GB",
      "AD",
      "LI",
      "MC",
      "ID",
      "TH",
      "VN",
      "RO",
      "IL",
      "ZA",
      "SA",
      "AE",
      "BH",
      "QA",
      "OM",
      "KW",
      "EG",
      "MA",
      "DZ",
      "TN",
      "LB",
      "JO",
      "PS",
      "IN",
      "BY",
      "KZ",
      "MD",
      "UA",
      "AL",
      "BA",
      "HR",
      "ME",
      "MK",
      "RS",
      "SI",
      "KR",
      "BD",
      "PK",
      "LK",
      "GH",
      "KE",
      "NG",
      "TZ",
      "UG",
      "AG",
      "AM",
      "BS",
      "BB",
      "BZ",
      "BT",
      "BW",
      "BF",
      "CV",
      "CW",
      "DM",
      "FJ",
      "GM",
      "GE",
      "GD",
      "GW",
      "GY",
      "HT",
      "JM",
      "KI",
      "LS",
      "LR",
      "MW",
      "MV",
      "ML",
      "MH",
      "FM",
      "NA",
      "NR",
      "NE",
      "PW",
      "PG",
      "WS",
      "SM",
      "ST",
      "SN",
      "SC",
      "SL",
      "SB",
      "KN",
      "LC",
      "VC",
      "SR",
      "TL",
      "TO",
      "TT",
      "TV",
      "VU",
      "AZ",
      "BN",
      "BI",
      "KH",
      "CM",
      "TD",
      "KM",
      "GQ",
      "SZ",
      "GA",
      "GN",
      "KG",
      "LA",
      "MO",
      "MR",
      "MN",
      "NP",
      "RW",
      "TG",
      "UZ",
      "ZW",
      "BJ",
      "MG",
      "MU",
      "MZ",
      "AO",
      "CI",
      "DJ",
      "ZM",
      "CD",
      "CG",
      "IQ",
      "LY",
      "TJ",
      "VE",
      "ET",
      "XK",
    ],
    disc_number: 1,
    duration_ms: 257773,
    explicit: false,
    external_ids: { isrc: "USUG12004717" },
    external_urls: {
      spotify: "https://open.spotify.com/track/12ntTeqEeTg7GAVpe8Mhpl",
    },
    href: "https://api.spotify.com/v1/tracks/12ntTeqEeTg7GAVpe8Mhpl",
    id: "12ntTeqEeTg7GAVpe8Mhpl",
    is_local: false,
    name: "marjorie",
    popularity: 66,
    preview_url:
      "https://p.scdn.co/mp3-preview/e95c0c95c1d2e6cfb6232280db5b21658e0a0dbc?cid=4f0e2034492a4683abeb6d0acb94aa0d",
    track_number: 13,
    type: "track",
    uri: "spotify:track:12ntTeqEeTg7GAVpe8Mhpl",
  };

  const trackFeats: TrackFeatures = {
    acousticness: 0.011,
    analysis_url:
      "https://api.spotify.com/v1/audio-analysis/11dFghVXANMlKmJXsNCbNl",
    danceability: 0.696,
    duration_ms: 207960,
    energy: 0.905,
    id: "11dFghVXANMlKmJXsNCbNl",
    instrumentalness: 0.000905,
    key: 2,
    liveness: 0.302,
    loudness: -2.743,
    mode: 1,
    speechiness: 0.103,
    tempo: 114.944,
    time_signature: 4,
    track_href: "https://api.spotify.com/v1/tracks/11dFghVXANMlKmJXsNCbNl",
    type: "audio_features",
    uri: "spotify:track:11dFghVXANMlKmJXsNCbNl",
    valence: 0.625,
  };

  try {
    console.log("Adding sample track to store:", {
      track: sampleTrack,
      features: trackFeats,
    });
    await setInStore("library", {
      track: sampleTrack,
      features: trackFeats,
    });
    console.log("Added sample song to store");
  } catch (error) {
    console.error("Error adding sample song to store", error);
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
