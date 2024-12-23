import { getAllFromStore, StoreName } from "@/helpers/database";
import {
  FormValues,
  NumericFeatures,
  PlaylistData,
  TrackObject,
  TrackFeatures,
  ChosenSeeds,
  GetRecommendationsOptions,
} from "@/types/types";
import axios from "axios";
import { fetchRecommendations } from "./fetchers";
import { getItemFromLocalStorage } from "./localStorage";
import { showErrorNotif } from "./general";

export async function startSearch(
  formValues: FormValues,
  anyTempo: boolean,
  activeSourceTab: string | null,
  chosenSeeds?: ChosenSeeds
): Promise<Map<string, TrackObject> | null | void> {
  const store: string = formValues.source;
  console.log("active source tab", activeSourceTab);
  if (activeSourceTab === "mySpotify") {
    console.log("active source tab my spotify");
    switch (store) {
      case "1":
        return await filterFromStore("library", formValues, anyTempo);

      case "2":
        return await filterFromStore("topTracks", formValues, anyTempo);

      case "3":
        return await getRecommendations(formValues, { anyTempo });

      default:
        return null;
    }
  } else if (activeSourceTab === "custom") {
    return await getRecommendations(formValues, { anyTempo, chosenSeeds });
  }
}

// Gets songs matching filters from saved songs or top songs library
// Returns array of matching tracks
async function filterFromStore(
  storeName: StoreName,
  formValues: FormValues,
  anyTempo: boolean
): Promise<Map<string, TrackObject> | null> {
  const matchingTracks = new Map<string, TrackObject>();

  try {
    const tracks = await getAllFromStore(storeName);

    for (const track of tracks) {
      const trackFeatures: TrackFeatures = track.features;
      if (matches(trackFeatures, formValues, anyTempo)) {
        // If track features match, add to map with id as key
        matchingTracks.set(track.track.id, track);
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

// Gets recommendations from Spotify based on filters
// Used for user "Get Recommendations"/"Custom" search, or used to populate Suggestions table
// Returns 5 recommended songs
export async function getRecommendations(
  formValues: FormValues,
  options: GetRecommendationsOptions
): Promise<Map<string, TrackObject> | null> {
  const { source, target, ...filters } = formValues;
  const { anyTempo, targetRecs, chosenSeeds } = options;

  // Convert String selections (Any, Low, Med, High) to target numbers
  const targetValence: number | null = convertToNumber(filters.targetValence);
  const targetDanceability: number | null = convertToNumber(
    filters.targetDanceability
  );
  const targetEnergy: number | null = convertToNumber(filters.targetEnergy);
  const targetInstrumentalness: number | null = convertToNumber(
    filters.targetInstrumentalness
  );
  const targetAcousticness: number | null = convertToNumber(
    filters.targetAcousticness
  );

  // Create object with numeric filters to pass to fetchRecommendations
  const numericFilters = {
    ...(!anyTempo && { minTempo: filters.minTempo }),
    ...(!anyTempo && { maxTempo: filters.maxTempo }),
    ...(targetValence !== null && { targetValence }),
    ...(targetDanceability !== null && { targetDanceability }),
    ...(targetEnergy !== null && { targetEnergy }),
    ...(targetInstrumentalness !== null && { targetInstrumentalness }),
    ...(targetAcousticness !== null && { targetAcousticness }),
  };

  // If a target is specified when passed to getRecs, use that (e.g. for fetching recommended below playlist)
  // otherwise, use the target from the form filters (e.g. user is searching with 'get recommendations' filter)
  const recs: Map<string, TrackObject> | null = await fetchRecommendations(
    numericFilters,
    targetRecs ? targetRecs : target,
    chosenSeeds
  );
  if (!recs) return null;
  return recs;
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

// Shuffles the matched songs and returns an array of a given size
// export function shuffleAndSlice(
//   matchingTracks: TrackObject[],
//   size: number
// ): TrackObject[] {
//   // Shuffles matches and returns a playlist the size requested
//   for (let i: number = matchingTracks.length - 1; i > 0; i--) {
//     const j: number = Math.floor(Math.random() * (i + 1));
//     const temp = matchingTracks[i];
//     matchingTracks[i] = matchingTracks[j];
//     matchingTracks[j] = temp;
//   }
//   return matchingTracks.slice(0, size);
// }

// Checks if a given track's features match values requested by the user
function matches(
  trackFeatures: TrackFeatures,
  formValues: FormValues,
  anyTempo: boolean
): boolean {
  const {
    minTempo,
    maxTempo,
    targetValence,
    targetDanceability,
    targetEnergy,
    targetInstrumentalness,
    targetAcousticness,
  } = formValues;

  if (
    !anyTempo &&
    (trackFeatures.tempo <= minTempo || trackFeatures.tempo >= maxTempo)
  ) {
    return false;
  }

  // Define the feature to check and the target
  const properties = [
    { name: "valence", target: targetValence },
    { name: "danceability", target: targetDanceability },
    { name: "energy", target: targetEnergy },
    { name: "instrumentalness", target: targetInstrumentalness },
    { name: "acousticness", target: targetAcousticness },
  ];

  // Function to generate a target range based on low/med/high
  function getRange(level: string) {
    switch (level) {
      case "Low":
        return { min: 0, max: 0.333 };
      case "Medium":
        return { min: 0.333, max: 0.666 };
      case "High":
        return { min: 0.666, max: 1 };
      default:
        return { min: 0, max: 1 };
    }
  }

  // Checks if a specific track feature (e.g. valence) is within range of the target level (low/med/high)
  function isInRange(trackFeature: number, targetLevel: string) {
    if (targetLevel === "Any") return true;
    const range = getRange(targetLevel);
    return trackFeature >= range.min && trackFeature < range.max;
  }

  // Loop through each feature to check if track is within the target range
  for (const { name, target } of properties) {
    if (!isInRange(trackFeatures[name as keyof NumericFeatures], target)) {
      return false;
    }
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
