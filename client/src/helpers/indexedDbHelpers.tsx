import {
  Artist,
  HighLevelFeatures,
  LowLevelFeatures,
  MbidAndTags,
  MetaBrainzFeatures,
  SavedTrack,
  StoredTrack,
  Track,
  TrackObject,
} from "@/types/types";
import { getAllFromStore, setInStore } from "./database";
import {
  fetchFeatures,
  fetchMBIDandTags,
  fetchSavedTracks,
  fetchTopArtists,
  fetchTopTracks,
} from "./fetchers";
import {
  showErrorNotif,
  showSuccessNotif,
  showWarnNotif,
  shuffleArray,
} from "./general";
import { storeDataInLocalStorage } from "./localStorage";

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function storeTopArtists(
  updateProgressBar: () => void
): Promise<boolean | null> {
  let success = true;
  const topArtists: Artist[] | null = await fetchTopArtists(updateProgressBar);

  if (topArtists) {
    for (const artist of topArtists) {
      try {
        await setInStore("topArtists", artist);
      } catch (error) {
        showErrorNotif(
          "Error",
          "There was an error storing top artists in the database."
        );
        console.error("Error details: ", error);
        success = false;
      }
    }
  } else {
    success = false; // fetchTopArtists will display an error in this case
  }

  success && showSuccessNotif("Success", "Your top artists were stored.");

  return success;
}

async function storeTracks(
  tracks: TrackObject[],
  updateProgressBar: () => void
): Promise<number> {
  let count: number = 0;
  for (const [index, track] of tracks.entries()) {
    try {
      await setInStore("savedTracks", {
        track: track.track,
        features: track.features,
        saved: true,
        order: index,
      });
      updateProgressBar();
      count++;
    } catch (error) {
      showErrorNotif(
        "Error",
        `Failed to store track in IDB (${track.track.id})`
      );
    }
  }
  return count;
}

// Stores user's saved tracks in IDB
// Stores saved: true as default for all
export async function storeSavedTracksData(
  updateProgressBar: () => void
): Promise<number | null> {
  // Get saved tracks from Spotify
  let savedTracks: SavedTrack[] | null = await fetchSavedTracks(
    updateProgressBar
  );
  if (!savedTracks) return null;
  const savedTracksArray: Track[] = [];
  for (const savedTrack of savedTracks) {
    savedTracksArray.push(savedTrack.track);
  }
  const libSize: number = savedTracks.length;
  let count: number = 0; // To track number of successes
  const tracks: TrackObject[] | null = await getTrackFeatures(savedTracksArray);
  if (tracks) {
    count = await storeTracks(tracks, updateProgressBar);
  }
  showSuccessNotif(
    "Stored saved tracks",
    `Features for ${count} out of ${libSize} were successfully retrieved.`
  );
  storeDataInLocalStorage("saved_tracks_success_count", count);
  return count;
}

// Stores user's top tracks in IDB
// saved: not included
export async function storeTopTracksData(
  updateProgressBar: () => void
): Promise<number | null> {
  let topTracks: Track[] | null = await fetchTopTracks(updateProgressBar);
  if (!topTracks) return null;
  const libSize: number = topTracks.length;
  let count = 0;
  // Get features for all topTracks
  const tracks: TrackObject[] | null = await getTrackFeatures(topTracks);
  if (tracks) {
    count = await storeTracks(tracks, updateProgressBar);
  }
  showSuccessNotif(
    "Stored top tracks",
    `Features for ${count} out of ${libSize} were successfully retrieved.`
  );
  storeDataInLocalStorage("top_tracks_success_count", count);
  return count;
}

// Gets track features from an array of Spotify tracks
// Adds features to TrackObject also containing Spotify track data
// Returns array of TrackObjects
export async function getTrackFeatures(
  tracks: Track[]
): Promise<TrackObject[] | null> {
  const trackObjectsArray: TrackObject[] = [];

  // Remove any tracks that do not have an isrc or were released after 2022
  // (AcousticBrainz will not have data for tracks after 2022)
  tracks = tracks.filter((track) => {
    const releaseYear: number = Number(track.album.release_date.slice(0, 4));
    return track.external_ids.isrc !== undefined && releaseYear < 2022;
  });

  // Fetch MetaBrainz data
  for (const track of tracks) {
    const isrc: string = track.external_ids.isrc!;
    const mbResponse: MbidAndTags | null = await fetchMBIDandTags(isrc);
    if (mbResponse) {
      const mbid: string = mbResponse.mbid;
      const tags: string[] = mbResponse.tags;

      const features: (LowLevelFeatures & HighLevelFeatures) | null =
        await fetchFeatures(mbid);

      if (features) {
        const abFeatures: LowLevelFeatures & HighLevelFeatures = features;
        const metaBrainzFeatures: MetaBrainzFeatures = {
          ...abFeatures,
          tags,
        };
        trackObjectsArray.push({ track: track, features: metaBrainzFeatures });
      }
    }
  }
  return trackObjectsArray;
}

// Returns top 5 tracks from database
export async function getShuffledTopTracks(): Promise<string[] | null> {
  try {
    const topTracks = await getAllFromStore("topTracks");
    if (!topTracks) {
      console.log("Couldn't find top tracks in database");
      return null;
    }

    const shuffledTopTracks: StoredTrack[] = shuffleArray(topTracks);

    // Extract track ids from db object
    const ids = shuffledTopTracks.map((entry) => entry.track.id);
    return ids;
  } catch (error) {
    console.error(`Error retrieving top 5 tracks:`, error);
    return null;
  }
}

// Returns random top 5 artists from database
export async function getShuffledTopArtists(): Promise<string[] | null> {
  try {
    const topArtists = await getAllFromStore("topArtists");
    if (!topArtists) {
      console.log("Couldn't find top artists in database");
      return null;
    }

    const shuffledTopArtists: Artist[] = shuffleArray(topArtists);

    const ids = shuffledTopArtists.map((artist) => artist.id);
    return ids;
  } catch (error) {
    console.error(`Error retrieving top 5 artists:`, error);
    return null;
  }
}

export async function getUserTopGenres(): Promise<string[] | null> {
  try {
    const topArtists: Artist[] = await getAllFromStore("topArtists");
    if (!topArtists) {
      console.log("Couldn't find top artists in database");
      return null;
    }

    const topGenres: Set<string> = new Set();
    topArtists.map((artist) =>
      artist.genres.map((genre) => topGenres.add(genre))
    );

    const topGenresArray = Array.from(topGenres);

    return shuffleArray(topGenresArray);
  } catch (error) {
    console.error(`Error retrieving top 5 artists:`, error);
    return null;
  }
}
