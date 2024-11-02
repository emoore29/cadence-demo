import { getAllFromStore, StoreName } from "@/helpers/database";
import {
  FormValues,
  PlaylistData,
  PlaylistObject,
  TrackFeatures,
} from "@/types/types";
import axios from "axios";
import { fetchRecommendations } from "./fetchers";
import { getItemFromLocalStorage } from "./localStorage";

export async function filterDatabase(
  formValues: FormValues
): Promise<[number, PlaylistObject[]] | null> {
  const store: string = formValues.source; // 1 = library, 2 = top tracks, 3 = recommendations

  switch (store) {
    case "1":
      return await filterFromStore("library", formValues);
    case "2":
      return await filterFromStore("topTracks", formValues);
    case "3":
      return await getRecommendations(formValues);
    default:
      return null;
  }
}

async function filterFromStore(
  storeName: StoreName,
  formValues: FormValues
): Promise<[number, PlaylistObject[]] | null> {
  let matchingTracks: PlaylistObject[] = [];

  try {
    const tracks = await getAllFromStore(storeName);
    for (const track of tracks) {
      const trackFeatures: TrackFeatures = track.features;
      // For each feature requested in the form, check if the song is a match
      const match: boolean = matches(trackFeatures, formValues);
      match && matchingTracks.push(track);
    }
    const totalMatches = matchingTracks.length;
    if (totalMatches > formValues.target) {
      matchingTracks = shuffleAndSlice(matchingTracks, formValues.target);
    }
    return [totalMatches, matchingTracks];
  } catch (error) {
    console.error(`Error fetching tracks from IDB ${storeName}`, error);
    return null;
  }
}

async function getRecommendations(
  formValues: FormValues
): Promise<[number, PlaylistObject[]] | null> {
  const { source, target, ...filters } = formValues;

  const recs: PlaylistObject[] | null = await fetchRecommendations(
    filters,
    target
  );

  if (recs) {
    return [recs.length, recs];
  } else {
    console.error("Fetch recommendations returned null");
    return null;
  }
}

// Function that finds the closest matches if the total matching tracks > target number tracks
function shuffleAndSlice(matchingTracks: PlaylistObject[], size: number) {
  // Shuffles matches and returns a playlist the size requested
  for (let i: number = matchingTracks.length - 1; i > 0; i--) {
    const j: number = Math.floor(Math.random() * (i + 1));
    const temp = matchingTracks[i];
    matchingTracks[i] = matchingTracks[j];
    matchingTracks[j] = temp;
  }
  return matchingTracks.slice(0, size);
}

// Checks if a given track's features match values requested by the user
function matches(
  trackFeatures: TrackFeatures,
  formValues: FormValues
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

  const buffer: number = 0.2; // +/- buffer for target values (e.g. target valence 0.5 +/- 0.2)
  if (trackFeatures.tempo <= minTempo || trackFeatures.tempo >= maxTempo) {
    return false;
  }
  if (
    (targetInstrumentalness &&
      trackFeatures.instrumentalness < targetInstrumentalness - buffer) ||
    (targetInstrumentalness &&
      trackFeatures.instrumentalness >= targetInstrumentalness + buffer)
  ) {
    // Instrumentals only returned with likelihood they are instrumentals > 70%
    return false;
  }
  if (
    (targetAcousticness &&
      trackFeatures.acousticness < targetAcousticness - buffer) ||
    (targetAcousticness &&
      trackFeatures.acousticness >= targetAcousticness + buffer)
  ) {
    // Acoustic only returned with likelihood they are acoustic > 50%
    return false;
  }
  if (
    trackFeatures.energy <= targetEnergy - buffer ||
    trackFeatures.energy >= targetEnergy + buffer
  ) {
    return false;
  }
  return true;
}

// Playlist
// Creates a new playlist on Spotify and then saves cadence playlist to it (2 separate post requests)
export async function savePlaylist(
  playlist: PlaylistObject[] | null,
  playlistData: PlaylistData
) {
  const accessToken: string | null = getItemFromLocalStorage("access_token");
  const user: string | null = getItemFromLocalStorage("user_data");
  if (accessToken && user) {
    const userId = JSON.parse(user).id;
    const playlistId: string | null = await createPlaylist(
      accessToken,
      playlistData,
      userId
    );

    if (playlistId) {
      const songUris: string[] = playlist!.map(
        (song) => `spotify:track:${song.track.id}`
      );
      return await addItemsToPlaylist(accessToken, playlistId, songUris);
    }
  } else {
    console.error("Could not retrieve user and/or access token.");
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

// Fill playlist if <20
// // Seed playlist with user's top tracks to get to 20
// if (playlist.length < 20 && storeName == "library") {
//   console.log(
//     "Playlist generated was too small! Sourcing songs from top tracks..."
//   );
//   const songIds = await getAllKeysFromStore("topTracks");
//   for (const id of songIds) {
//     if (playlist.length >= 20) break;
//     const song = (await getFromStore("topTracks", id)) as {
//       track: Track;
//       features: TrackFeatures;
//     };
//     const songFeatures: TrackFeatures = song.features;
//     // For each feature requested in the form, check if the song is a match
//     if (
//       songFeatures.tempo >= Number(bpm[0]) &&
//       songFeatures.tempo <= Number(bpm[1])
//     ) {
//       playlist.push(song.track);
//     }
//   }
// }

// if (playlist.length < 20) {
//   // Playlist is still too small after sourcing from library and top songs
//   // Get recommended songs based on user's top tracks and top artists
//   console.log(
//     "Playlist generated was too small! Sourcing recommendations from Spotify based on your listening habits."
//   );

//   // Get top 5 artists
//   const topArtists = await getAllFromStore("topArtists");
//   const topTracks = await getAllFromStore("topTracks");
//   topTracks.sort((a, b) => a.order - b.order);
//   console.log("top tracks from idb: ", topTracks);
//   const topTrackIds = topTracks.map((track) => track.track.id);
//   const topArtistIds = topArtists.map((artist) => artist.id);
//   console.log("top 5 track ids:", topTrackIds.slice(0, 5));
//   console.log("artist ids:", topArtistIds);

//   const accessToken = getItemFromLocalStorage("access_token");
//   if (!accessToken) {
//     console.error("Access token not found.");
//     return null;
//   }

//   const params = new URLSearchParams({
//     seed_artists: topArtistIds.slice(0, 2).join(","),
//     seed_tracks: topTrackIds.slice(0, 2).join(","),
//     min_tempo: bpm[0],
//     max_tempo: bpm[1],
//   });

//   try {
//     const res = await axios.get(
//       `https://api.spotify.com/v1/recommendations?${params}`,
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log("recommendations:", res.data);
//     const recs: Track[] = res.data.tracks;

//     for (const rec of recs) {
//       if (playlist.length >= 20) break;
//       playlist.push(rec);
//     }
//   } catch (error) {
//     console.error("Error fetching top artists:", error);
//     return null;
//   }

//   // Get top 5 tracks
//   // Get top 5 genres
