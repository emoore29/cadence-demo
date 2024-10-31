import { getAllFromStore, StoreName } from "@/helpers/database";
import {
  FormValues,
  PlaylistData,
  PlaylistObject,
  Track,
  TrackFeatures,
} from "@/types/types";
import axios from "axios";
import { getItemFromLocalStorage } from "./localStorage";

export async function filterDatabase(
  formValues: FormValues
): Promise<PlaylistObject[] | null> {
  console.log(`filtering from ${formValues.source}`);
  console.log(`instrumental target`, formValues.instrumental);
  let playlist: PlaylistObject[] = [];
  const storeName: string = formValues.source;
  try {
    const tracks = await getAllFromStore(storeName);
    for (const track of tracks) {
      if (playlist.length >= 25) break;
      const trackFeatures: TrackFeatures = track.features;
      // For each feature requested in the form, check if the song is a match

      const match: boolean = matches(trackFeatures, formValues);
      match && playlist.push(track);
    }
    console.log("Final playlist:", playlist);
    return playlist;
  } catch (error) {
    console.error(`Error fetching tracks from IDB ${storeName}`, error);
    return null;
  }
}

// Checks if a given track's features match values requested by the user
function matches(
  trackFeatures: TrackFeatures,
  formValues: FormValues
): boolean {
  const buffer: number = 0.3;
  if (
    trackFeatures.tempo <= formValues.minBpm ||
    trackFeatures.tempo >= formValues.maxBpm
  ) {
    return false;
  }
  if (
    (formValues.instrumental && trackFeatures.instrumentalness < 0.95) ||
    (!formValues.instrumental && trackFeatures.instrumentalness >= 0.95)
  ) {
    return false;
  }
  if (
    (formValues.acoustic && trackFeatures.acousticness < 0.95) ||
    (!formValues.acoustic && trackFeatures.acousticness >= 0.95)
  ) {
    return false;
  }
  if (
    trackFeatures.energy <= formValues.energy - buffer ||
    trackFeatures.energy >= formValues.energy + buffer
  ) {
    return false;
  }
  return true;
}

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
