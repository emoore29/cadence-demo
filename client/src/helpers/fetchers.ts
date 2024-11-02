import axios from "axios";
import {
  Artist,
  FeaturesLibrary,
  Filters,
  Library,
  NumericFilters,
  PlaylistObject,
  Recommendations,
  SavedTrack,
  TopTracks,
  Track,
  TrackFeatures,
  User,
} from "../types/types";
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
      console.error(`There was an error fetching user data:`, error);
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
      console.error(`There was an error fetching user data:`, error);
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
      console.error("Error fetching user's library: ", error);
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
  if (accessToken) {
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
        console.error("Error fetching library features: ", error);
        return null;
      }
    }
    console.log("Library features loaded");
    return featuresLibrary;
  } else {
    return null;
  }
}

// Fetches user's top 50 tracks from last 12 months (long_term)
// Returns Track[] or null if failed to fetch
export async function fetchTopTracks(): Promise<Track[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");

  if (accessToken) {
    let topTracks: Track[] = [];
    let nextUrl =
      "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50";
    try {
      while (nextUrl && topTracks.length < 100) {
        const res = await axios.get<TopTracks>(nextUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        topTracks = [...topTracks, ...res.data.items];
        nextUrl = res.data.next;
      }

      // Log songs fetched to console to check they're all there.
      console.log("Your top tracks were fetched: ", topTracks.length);
      return topTracks;
    } catch (error) {
      console.error("Error fetching user's top tracks: ", error);
      return null;
    }
  } else {
    return null;
  }

  // if (accessToken) {
  //   try {
  //     const res = await axios.get(
  //       `https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     return res.data.items;
  //   } catch (error) {
  //     console.error("Error fetching top tracks:", error);
  //     return null;
  //   }
  // } else {
  //   return null;
  // }
}

// Fetches user's top track features
// Takes a Track[] of user's top tracks
// Returns TrackFeatures[] or null if failed to fetch
export async function fetchTopTrackFeatures(
  topTracks: Track[]
): Promise<TrackFeatures[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (accessToken) {
    const songIds = topTracks.map((song) => song!.id);
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
      return res.data.audio_features;
    } catch (error) {
      console.error("Error fetching library features: ", error);
      return null;
    }
  } else {
    return null;
  }
}

// Fetches user's top 5 artists from last 12 months (long_term)
// Returns Artist[] or null if failed to fetch
export async function fetchTopArtists(): Promise<Artist[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (accessToken) {
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
      console.error("Error fetching top artists:", error);
      return null;
    }
  } else {
    return null;
  }
}

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

// Fetches X number of recommended tracks + their features
// Returns PlaylistObject[] containing recommended songs and their features
export async function fetchRecommendations(
  filters: NumericFilters,
  target: number
): Promise<PlaylistObject[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  const topTracks: string[] | null = await getTop5TrackIds();
  const topArtists: string[] | null = await getTop5ArtistIds();
  if (!accessToken || !topTracks || !topArtists) return null;

  const trackIds: string = topTracks.slice(0, 1).join(",");
  const artistIds: string = topArtists.slice(0, 4).join(",");

  let recommendations: PlaylistObject[] = [];

  // Convert filter values to strings for URl params
  const params = new URLSearchParams({
    ...parseFilters(filters),
    limit: String(target),
    seed_artists: artistIds,
    seed_tracks: trackIds,
  });

  let recommendedTracks: Track[];

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
    console.error("Error fetching recommendations:", error);
    return null;
  }

  let recommendedTrackFeatures: TrackFeatures[];
  const songIds = recommendedTracks.map((song) => song!.id);
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
    console.error("Error fetching recommended tracks' features: ", error);
    return null;
  }

  for (const track of recommendedTracks) {
    const features = recommendedTrackFeatures.find((f) => f.id === track.id);
    if (features) {
      recommendations.push({
        track: track,
        features: features,
      });
    } else {
      console.warn(`No features found for track ID ${track.id}`);
    }
  }
  console.log("recommended songs:", recommendations);
  return recommendations;
}
