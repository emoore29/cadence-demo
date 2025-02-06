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
  ABFeaturesResponse,
  fetchSavedTracks,
  fetchTopArtists,
  fetchTopTracks,
  fetchTrackABFeatures,
  fetchTrackMBIDandTags,
  MBIDResponseData,
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

// Stores user's top tracks in IDB
// saved: not included
export async function storeTopTracksData(
  updateProgressBar: () => void
): Promise<number | null> {
  let topTracks: Track[] | null = await fetchTopTracks(updateProgressBar);
  if (!topTracks) return null;

  const libSize: number = topTracks.length;
  let success = true;
  let count = 0;

  // Remove any tracks that do not have an isrc
  topTracks = topTracks.filter(
    (topTrack) => topTrack.external_ids.isrc !== undefined
  );

  // Initialise AcousticBrainz rate limit data
  let abRemaining: number = 100;
  let abResetIn: number = 5;

  // Add each top track and its features to IDB
  for (const [index, topTrack] of topTracks.entries()) {
    console.log(`fetching top track ${index}`);
    // assert that isrc is not null (filtered out above)
    const isrc: string = topTrack.external_ids.isrc!;

    // Fetch MBID and tags from MusicBrainz
    const mbResponse: MBIDResponseData | null = await fetchTrackMBIDandTags(
      isrc
    );

    if (mbResponse) {
      // Relevant data
      const mbid: string = mbResponse.data[0];
      const tags: string[] = mbResponse.data[1];

      // Fetch AcousticBrainz features for track
      const abResponse: ABFeaturesResponse | null = await fetchTrackABFeatures(
        mbid
      );

      // If features available, store in IDB
      if (abResponse) {
        const abFeatures: AcousticBrainzFeatures = abResponse.data;
        const mbFeatures: MetaBrainzFeatures = {
          ...abFeatures,
          tags,
        };

        // Note rate limit for AcousticBrainz
        abRemaining = abResponse.rateLimit[0];
        abResetIn = abResponse.rateLimit[1];

        try {
          await setInStore("topTracks", {
            track: topTrack,
            features: mbFeatures,
            order: index,
          });

          count += 1;
        } catch (error) {
          showErrorNotif(
            "Error",
            `Could not store track in IDB (${topTrack.id})`
          );
          success = false;
        }
      }
    }

    // Set delay if AB rate limit reached
    if (abRemaining == 0) {
      console.log("Awaiting AcousticBrainz rate limit reset");
      await delay(abResetIn * 1000);
    }

    // Await >1 second for MusicBrainz
    await delay(1050);
    updateProgressBar();
  }

  if (success) {
    showSuccessNotif(
      "Top tracks and features stored",
      "Your top tracks were successfully stored."
    );
  } else {
    showWarnNotif("Warning", "Some or all top tracks could not be stored");
  }

  showSuccessNotif(
    "Success",
    `Features for ${count} out of ${libSize} were successfully retrieved.`
  );

  storeDataInLocalStorage("top_tracks_success_count", count);

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

  const libSize: number = savedTracks.length;
  let success: boolean = true; // To track if any failures occur
  let count: number = 0; // To track number of successes

  // Remove any tracks that do not have a defined isrc
  savedTracks = savedTracks.filter(
    (savedTrack) => savedTrack.track.external_ids.isrc !== undefined
  );

  // Get each track's features from MusicBrainz/AcousticBrainz
  // Get each track's preview URL from Deezer
  let abRemaining: number = 100;
  let abResetIn: number = 5;
  // Add each saved track and features to IDB individually
  for (const [index, savedTrack] of savedTracks.entries()) {
    if (count == 49) {
      console.log("waiting 5 seconds for Deezer rate limit");
      await delay(5000);
      count = 0;
    }
    console.log(`handling saved track ${index}...`);

    // assert that isrc is not null (filtered out above)
    const isrc: string = savedTrack.track.external_ids.isrc!;

    // Fetch MBID + tags from MusicBrainz
    const mbResponse: MBIDResponseData | null = await fetchTrackMBIDandTags(
      isrc
    );
    if (mbResponse) {
      // Relevant data
      const mbid: string = mbResponse.data[0];
      const tags: string[] = mbResponse.data[1];

      // Fetch AcousticBrainz features for track
      const abResponse: ABFeaturesResponse | null = await fetchTrackABFeatures(
        mbid
      );

      if (abResponse) {
        const abFeatures: AcousticBrainzFeatures = abResponse.data;
        // Relevant data
        const mbFeatures: MetaBrainzFeatures = {
          ...abFeatures,
          tags,
        };

        // Note rate limit for AcousticBrainz
        abRemaining = abResponse.rateLimit[0];
        abResetIn = abResponse.rateLimit[1];

        // Get preview URL for track from Deezer
        try {
          const response = await fetch(
            `http://localhost:3000/search_deezer?trackName=${encodeURIComponent(
              savedTrack.track.name
            )}&trackArtist=${encodeURIComponent(
              savedTrack.track.artists[0].name
            )}`
          );
          const data = await response.json();
          if (data.previewUrl) {
            // Update track preview url
            savedTrack.track.preview_url = data.previewUrl;
            console.log(`Added preview URL for track ${savedTrack.track.id}`);
          } else {
            console.warn(
              `No preview URL found for track ${savedTrack.track.id}`
            );
          }
        } catch (error) {
          console.error("Error fetching Deezer track:", error);
        }

        // Add track and features to IDB
        try {
          await setInStore("savedTracks", {
            track: savedTrack.track,
            features: mbFeatures,
            saved: true,
            order: index,
          });
          console.log(`Stored track ${savedTrack.track.name}, +1 to count!`);
          count += 1;
        } catch (error) {
          showErrorNotif(
            "Error",
            `Could not store track in IDB (${savedTrack.track.id})`
          );
        }
      }
    }

    // Set delay if AB rate limit reached
    if (abRemaining == 0) {
      console.log("Awaiting AcousticBrainz rate limit reset");
      await delay(abResetIn * 1000);
    }

    // Await minimum 1 second for MusicBrainz (rate limits not accessible from API response headers
    // Access-Control-Expose-Headers needs to be set by MB servers)
    await delay(1050);
    updateProgressBar();
  }

  if (success) {
    showSuccessNotif(
      "Saved tracks and features stored",
      "Your saved tracks were successfully stored."
    );
  } else {
    showWarnNotif("Warning", "Some or all saved tracks could not be stored");
  }

  showSuccessNotif(
    "Success",
    `Features for ${count} out of ${libSize} were successfully retrieved.`
  );

  storeDataInLocalStorage("saved_tracks_success_count", count);

  return count;
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
