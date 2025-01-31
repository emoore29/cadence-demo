// Fetches user's top tracks features

import {
  ChosenSeeds,
  FeaturesLibrary,
  NumericFilters,
  Recommendations,
  SavedTrack,
  Track,
  TrackFeatures,
  TrackObject,
} from "@/types/types";
import { getItemFromLocalStorage } from "./localStorage";
import { chunk } from "lodash";
import axios from "axios";
import { generateSeeds, parseFilters, showErrorNotif } from "./general";

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
