import {
  Artist,
  SavedTrack,
  StoredTrack,
  Track,
  TrackFeatures,
} from "@/types/types";
import { getAllFromStore, setInStore } from "./database";
import {
  fetchSavedTracks,
  fetchSavedTracksFeatures,
  fetchTopArtists,
  fetchTopTrackFeatures,
  fetchTopTracks,
} from "./fetchers";
import {
  showErrorNotif,
  showSuccessNotif,
  showWarnNotif,
  shuffleArray,
} from "./general";
import { demoLibrary } from "@/demoData/demoLibrary";
import { demoTopTracks } from "@/demoData/demoTopTracks";
import { demoRecommendations } from "@/demoData/demoRecommendations";

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

// Stores user's top tracks in IDB
// saved: not included
export async function storeTopTracksData(
  updateProgressBar: () => void
): Promise<boolean | null> {
  const topTracks: Track[] | null = await fetchTopTracks(updateProgressBar);
  if (!topTracks) return null;

  const topTrackFeatures: TrackFeatures[] | null = await fetchTopTrackFeatures(
    topTracks,
    updateProgressBar
  );
  if (!topTrackFeatures) return null;

  const success = storeUserTopTrackData(topTracks, topTrackFeatures);
  return success;
}

// Stores user's saved tracks in IDB
// Stores saved: true for all
export async function storeSavedTracksData(
  updateProgressBar: () => void
): Promise<boolean | null> {
  const lib: SavedTrack[] | null = await fetchSavedTracks(updateProgressBar);
  if (!lib) return null;

  const feats: TrackFeatures[] | null = await fetchSavedTracksFeatures(
    lib,
    updateProgressBar
  );
  if (!feats) return null;

  const success = storeUserLibraryAndFeatures(lib, feats);
  return success;
}

export async function storeUserTopTrackData(
  topTracks: Track[],
  topTrackFeatures: TrackFeatures[]
): Promise<boolean> {
  let success = true;

  for (const [index, track] of topTracks.entries()) {
    const trackId = track.id;
    const trackFeatures = topTrackFeatures.find(
      (features) => features.id === trackId
    ); // Find corresponding features

    if (trackFeatures) {
      // Save the track and its features to IndexedDB
      try {
        await setInStore("topTracks", {
          track: track,
          features: trackFeatures,
          order: index, // Add order based on position in the topTracks array, so that the top of the top can be retrieved
        });
      } catch (error) {
        console.warn(`Error storing track ${trackId} in IndexedDB:`, error);
        success = false;
      }
    } else {
      console.warn(`No features found for track ID ${trackId}`);
      success = false;
    }
  }

  if (success) {
    showSuccessNotif(
      "Top tracks stored",
      "Your top tracks were successfully stored."
    );
  } else {
    showWarnNotif("Warning", "Some or all tracks could not be stored.");
  }
  return success;
}

// Populates the library in IndexedDB
export async function storeUserLibraryAndFeatures(
  library: SavedTrack[],
  featuresLibrary: TrackFeatures[]
): Promise<boolean> {
  console.log("Storing songs and their features..");
  let success = true;

  for (const [index, track] of library.entries()) {
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
          saved: true,
          order: index,
        });
      } catch (error) {
        console.error(`Error storing track ${trackId} in IndexedDB:`, error);
        success = false;
      }
    } else {
      console.warn(`No features found for track ID ${trackId}`);
      success = false;
    }
  }

  if (success) {
    console.log("All tracks successfully stored in IDB");
  } else {
    console.warn("Some or all tracks could not be stored in IndexedDB");
  }

  return success;
}

export async function storeDemoLibrary(
  updateProgressBar: () => void
): Promise<boolean> {
  let success = true;

  // Add each track to the IDB library
  for (let i = 0; i < demoLibrary.length; i++) {
    const track = demoLibrary[i][1].track;
    const trackFeatures = demoLibrary[i][1].features;
    try {
      await setInStore("demoTracks", {
        track: track,
        features: trackFeatures,
        saved: true,
        order: i,
      });
      updateProgressBar(); // TODO: Update estimated fetches to align with demo library size rather than real library size
    } catch (error) {
      console.error(
        `Error storing track ${demoLibrary[i][0]} in IndexedDB:`,
        error
      );
      success = false;
    }
  }
  success && showSuccessNotif("Success", "Demo saved tracks were loaded.");

  return success;
}

export async function storeDemoRecommendations(
  updateProgressBar: () => void
): Promise<boolean> {
  let success = true;

  // Add each track to the IDB library
  for (let i = 0; i < demoRecommendations.length; i++) {
    const track = demoRecommendations[i][1].track;
    const trackFeatures = demoRecommendations[i][1].features;
    try {
      await setInStore("recommendations", {
        track: track,
        features: trackFeatures,
        order: i,
      });
      updateProgressBar();
    } catch (error) {
      console.error(
        `Error storing track ${demoRecommendations[i][0]} in IndexedDB:`,
        error
      );
      success = false;
    }
  }
  success && showSuccessNotif("Success", "Demo recommendations were loaded.");
  return success;
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
