import {
  AcousticBrainzFeatures,
  Artist,
  MetaBrainzFeatures,
  SavedTrack,
  StoredTrack,
  Track,
} from "@/types/types";
import { getAllFromStore, setInStore } from "./database";
import {
  fetchSavedTracks,
  fetchTopArtists,
  fetchTopTracks,
  fetchTrackABFeatures,
  fetchTrackMBIDandTags,
} from "./fetchers";
import {
  showErrorNotif,
  showSuccessNotif,
  showWarnNotif,
  shuffleArray,
} from "./general";

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
  let topTracks: Track[] | null = await fetchTopTracks(updateProgressBar);
  if (!topTracks) return null;

  let success = true;

  // Remove any tracks that do not have an isrc
  topTracks = topTracks.filter(
    (topTrack) => topTrack.external_ids.isrc !== undefined
  );

  // Add each top track and its features to IDB
  for (const [index, topTrack] of topTracks.entries()) {
    // assert that isrc is not null (filtered out above)
    const isrc: string = topTrack.external_ids.isrc!;
    const trackMBIDandTags: [string, string[]] | null =
      await fetchTrackMBIDandTags(isrc);
    if (trackMBIDandTags) {
      const mbid: string = trackMBIDandTags[0];
      const abFeatures: AcousticBrainzFeatures | null =
        await fetchTrackABFeatures(mbid);
      const tags: string[] = trackMBIDandTags[1];

      if (abFeatures) {
        const mbFeatures: MetaBrainzFeatures = {
          ...abFeatures,
          tags,
        };

        try {
          await setInStore("topTracks", {
            track: topTrack,
            features: mbFeatures,
            order: index,
          });
        } catch (error) {
          showErrorNotif(
            "Error",
            `Could not store track in IDB (${topTrack.id})`
          );
          success = false;
        }
      }
    }
  }

  return success;
}

// Stores user's saved tracks in IDB
// Stores saved: true as default for all
export async function storeSavedTracksData(
  updateProgressBar: () => void
): Promise<boolean | null> {
  let savedTracks: SavedTrack[] | null = await fetchSavedTracks(
    updateProgressBar
  );
  if (!savedTracks) return null;

  let success = true;

  // Remove any tracks that do not have a defined isrc
  savedTracks = savedTracks.filter(
    (savedTrack) => savedTrack.track.external_ids.isrc !== undefined
  );

  // Add each saved track and features to IDB individually
  for (const [index, savedTrack] of savedTracks.entries()) {
    // assert that isrc is not null (filtered out above)
    const isrc: string = savedTrack.track.external_ids.isrc!;
    const trackMBIDandTags: [string, string[]] | null =
      await fetchTrackMBIDandTags(isrc);
    if (trackMBIDandTags) {
      const mbid: string = trackMBIDandTags[0];
      const abFeatures: AcousticBrainzFeatures | null =
        await fetchTrackABFeatures(mbid);
      const tags: string[] = trackMBIDandTags[1];

      if (abFeatures) {
        const mbFeatures: MetaBrainzFeatures = {
          ...abFeatures,
          tags,
        };

        try {
          await setInStore("savedTracks", {
            track: savedTrack.track,
            features: mbFeatures,
            saved: true,
            order: index,
          });
        } catch (error) {
          showErrorNotif(
            "Error",
            `Could not store track in IDB (${savedTrack.track.id})`
          );
          success = false;
        }
      }
    }
  }

  if (success) {
    showSuccessNotif(
      "Saved tracks and features stored",
      "Your top tracks were successfully stored."
    );
  } else {
    showWarnNotif("Warning", "Some or all saved tracks could not be stored");
  }
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
