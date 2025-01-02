import axios from "axios";
import { chunk } from "lodash";
import {
  Artist,
  ChosenSeeds,
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
import {
  generateSeeds,
  parseFilters,
  showErrorNotif,
  showWarnNotif,
} from "./general";
import { getItemFromLocalStorage } from "./localStorage";
import { genres } from "@/demoData/genres";

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
    while (nextUrl) {
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

// Fetches user's saved tracks features
// Returns TrackFeatures[] or null on failure
export async function fetchSavedTracksFeatures(
  savedTracks: SavedTrack[],
  updateProgressBar: () => void
): Promise<TrackFeatures[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  const features: TrackFeatures[] = [];
  const chunks = chunk(savedTracks, 100);
  for (const chunk of chunks) {
    const ids = chunk.map((song) => song.track.id);
    try {
      const res = await axios.get<FeaturesLibrary>(
        "https://api.spotify.com/v1/audio-features",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            ids: ids.join(","),
          },
        }
      );
      features.push(...res.data.audio_features);
      updateProgressBar();
    } catch (error) {
      showErrorNotif(
        "Error",
        "Spotify has deprecated this endpoint. Unable to fetch your library features."
      );
      return null;
    }
  }
  return features;
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

// Fetches user's top tracks features
// Returns TrackFeatures[] or null on failure
export async function fetchTopTrackFeatures(
  topTracks: Track[],
  updateProgressBar: () => void
): Promise<TrackFeatures[] | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  const features: TrackFeatures[] = [];
  const chunks = chunk(topTracks, 100);
  for (const chunk of chunks) {
    const ids = chunk.map((song) => song!.id);
    try {
      const res = await axios.get<FeaturesLibrary>(
        "https://api.spotify.com/v1/audio-features",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            ids: ids.join(","),
          },
        }
      );
      features.push(...res.data.audio_features);
      updateProgressBar();
    } catch (error) {
      showErrorNotif(
        "Error",
        "Spotify has deprecated this endpoint. Unable to fetch your top track features."
      );
      return null;
    }
  }
  return features;
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

// Fetches Spotify recommendations based on form filters
// Returns Map<string, TrackObject> or null on failure
export async function fetchRecommendations(
  filters: NumericFilters,
  target: number,
  chosenSeeds?: ChosenSeeds
): Promise<Map<string, TrackObject> | null> {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  if (!accessToken) return null;
  const seeds = await generateSeeds(chosenSeeds);
  if (!seeds) return null;
  const { trackIds, artistIds, genres } = seeds;
  const paramsObject: {
    [key: string]: string;
  } = {
    ...parseFilters(filters),
    limit: String(target),
  };
  if (artistIds) paramsObject.seed_artists = artistIds;
  if (genres) paramsObject.seed_genres = encodeURIComponent(genres);
  if (trackIds) paramsObject.seed_tracks = trackIds;
  const params = new URLSearchParams(paramsObject);

  let recommendations: Map<string, TrackObject> = new Map();
  let recommendedTracks: Track[];
  let recommendedTrackFeatures: TrackFeatures[];

  // Get recommended tracks
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
    showErrorNotif(
      "Error",
      "Spotify has deprecated this endpoint. Unable to fetch recommendations."
    );
    return null;
  }

  const ids = recommendedTracks.map((song) => song!.id);

  // Get recommended tracks' features
  try {
    const res = await axios.get<FeaturesLibrary>(
      "https://api.spotify.com/v1/audio-features",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          ids: ids.join(","),
        },
      }
    );
    recommendedTrackFeatures = res.data.audio_features;
  } catch (error) {
    showErrorNotif(
      "Error",
      "Spotify has deprecated this endpoint. Unable to fetch recommended track features."
    );
    return null;
  }

  // Create TrackObjects from recommendations + features & add to Map
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

  // console.log("Recommendations", recommendations);
  // saveMapToJsonFile(recommendations, "recommendations.json");
  return recommendations;
}

// Function used to get demo data
// async function saveMapToJsonFile(
//   map: Map<string, any>,
//   fileName: string
// ): Promise<void> {
//   try {
//     // Convert the Map to an array of key-value pairs
//     const mapArray = Array.from(map.entries());

//     // Convert the array to a JSON string
//     const jsonData = JSON.stringify(mapArray, null, 2);

//     // Create a Blob with the JSON data
//     const blob = new Blob([jsonData], { type: "application/json" });

//     // Create a downloadable link
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = fileName;

//     // Trigger the download
//     a.click();

//     // Clean up the URL object
//     URL.revokeObjectURL(url);

//     console.log(`Map saved to ${fileName}`);
//   } catch (error) {
//     console.error(`Error saving map to JSON file:`, error);
//   }
// }

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
  if (!accessToken) return null;

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
      await deleteFromStore("library", trackObj.track.id);
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
      await setInStore("library", trackObj);
      return "Added";
    } catch (error) {
      showErrorNotif("Error", "There was an error adding track to Spotify.");
      return null;
    }
  }
}

// Get available genre seeds
export async function getAvailableGenreSeeds(): Promise<string[] | null> {
  // ↓ Code for fetching genres if API endpoint were available ↓
  // const accessToken: string | null = getItemFromLocalStorage("access_token");
  // if (!accessToken) return null;

  // try {
  //   const res = await axios.get(
  //     "https://api.spotify.com/v1/recommendations/available-genre-seeds",
  //     {
  //       headers: { Authorization: `Bearer ${accessToken}` },
  //     }
  //   );
  //   return res.data.genres;
  // } catch (error) {
  //   showErrorNotif(
  //     "Error",
  //     "Spotify has deprecated this endpoint. Unable to fetch available genres."
  //   );
  //   return null;
  // }

  // ↓ Return genre seeds from demo data ↓
  return genres;
}

// Search for artist
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

// Search for track
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
