import { Artist, SavedTrack, Track, TrackFeatures } from "@/types/types";
import { setInStore } from "./database";
import {
  fetchSavedTracks,
  fetchSavedTracksFeatures,
  fetchTopArtists,
  fetchTopTrackFeatures,
  fetchTopTracks,
} from "./fetchers";

export async function storeTopArtists(): Promise<boolean | null> {
  let success = true;
  const topArtists: Artist[] | null = await fetchTopArtists();
  if (topArtists) {
    for (const artist of topArtists) {
      try {
        await setInStore("topArtists", artist);
      } catch (error) {
        console.error(`Error storing artist in IndexedDB:`, error);
        success = false;
      }
    }
  } else {
    success = false; // fetchTopArtists will throw an error in this case
  }
  return success;
}

export async function storeTopTracksData(): Promise<boolean | null> {
  const topTracks: Track[] | null = await fetchTopTracks();

  if (topTracks) {
    const topTrackFeatures: TrackFeatures[] | null =
      await fetchTopTrackFeatures(topTracks);

    if (topTrackFeatures) {
      const success = storeUserTopTrackData(topTracks, topTrackFeatures);
      return success;
    } else {
      console.error("Error loading user's library features.");
      return null;
    }
  } else {
    console.error("Error loading the user's library");
    return null;
  }
}

export async function storeSavedTracksData(): Promise<boolean | null> {
  const lib: SavedTrack[] | null = await fetchSavedTracks();

  if (lib) {
    const feats: TrackFeatures[] | null = await fetchSavedTracksFeatures(lib);

    if (feats) {
      const success = storeUserLibraryAndFeatures(lib, feats);
      return success;
    } else {
      console.error("Error loading user's library features.");
      return null;
    }
  } else {
    console.error("Error loading the user's library");
    return null;
  }
}

export async function storeUserTopTrackData(
  topTracks: Track[],
  topTrackFeatures: TrackFeatures[]
): Promise<boolean> {
  console.log("Storing top tracks and their features..");
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
          order: index, // Add order based on position in the topTracks array
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
