import {
  getAllFromStore,
  getAllKeysFromStore,
  getFromStore,
  StoreName,
} from "@/helpers/database";
import { getItemFromLocalStorage } from "@/helpers/localStorage";
import axios from "axios";
import { TrackFeatures, Track } from "@/types/types";

export async function filterDatabase(storeName: StoreName) {
  // Get each song's features from the database
  // Check if the features are a match

  let playlist: Track[] = [];

  try {
    const songIds = await getAllKeysFromStore(storeName);
    for (const id of songIds) {
      if (playlist.length >= 20) break;
      const song = (await getFromStore(storeName, id)) as {
        track: Track;
        features: TrackFeatures;
      };
      const songFeatures: TrackFeatures = song.features;
      // For each feature requested in the form, check if the song is a match
      if (
        songFeatures.tempo >= Number(bpm[0]) &&
        songFeatures.tempo <= Number(bpm[1])
      ) {
        playlist.push(song.track);
      }
    }

    // Seed playlist with user's top tracks to get to 20
    if (playlist.length < 20 && storeName == "library") {
      console.log(
        "Playlist generated was too small! Sourcing songs from top tracks..."
      );
      const songIds = await getAllKeysFromStore("topTracks");
      for (const id of songIds) {
        if (playlist.length >= 20) break;
        const song = (await getFromStore("topTracks", id)) as {
          track: Track;
          features: TrackFeatures;
        };
        const songFeatures: TrackFeatures = song.features;
        // For each feature requested in the form, check if the song is a match
        if (
          songFeatures.tempo >= Number(bpm[0]) &&
          songFeatures.tempo <= Number(bpm[1])
        ) {
          playlist.push(song.track);
        }
      }
    }

    if (playlist.length < 20) {
      // Playlist is still too small after sourcing from library and top songs
      // Get recommended songs based on user's top tracks and top artists
      console.log(
        "Playlist generated was too small! Sourcing recommendations from Spotify based on your listening habits."
      );

      // Get top 5 artists
      const topArtists = await getAllFromStore("topArtists");
      const topTracks = await getAllFromStore("topTracks");
      topTracks.sort((a, b) => a.order - b.order);
      console.log("top tracks from idb: ", topTracks);
      const topTrackIds = topTracks.map((track) => track.track.id);
      const topArtistIds = topArtists.map((artist) => artist.id);
      console.log("top 5 track ids:", topTrackIds.slice(0, 5));
      console.log("artist ids:", topArtistIds);

      const accessToken = getItemFromLocalStorage("access_token");
      if (!accessToken) {
        console.error("Access token not found.");
        return null;
      }

      const params = new URLSearchParams({
        seed_artists: topArtistIds.slice(0, 2).join(","),
        seed_tracks: topTrackIds.slice(0, 2).join(","),
        min_tempo: bpm[0],
        max_tempo: bpm[1],
      });

      try {
        const res = await axios.get(
          `https://api.spotify.com/v1/recommendations?${params}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("recommendations:", res.data);
        const recs: Track[] = res.data.tracks;

        for (const rec of recs) {
          if (playlist.length >= 20) break;
          playlist.push(rec);
        }
      } catch (error) {
        console.error("Error fetching top artists:", error);
        return null;
      }

      // Get top 5 tracks
      // Get top 5 genres
    }

    console.log("playlist generated:", playlist);
    setPlaylist(playlist);
  } catch (error) {
    console.error(`Error fetching keys from IDB ${storeName}`, error);
  }
}
