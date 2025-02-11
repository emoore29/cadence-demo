import { ChosenSeeds, NumericFilters, TrackObject } from "@/types/types";
import { notifications } from "@mantine/notifications";
import { deleteFromStore, getTrackFromStore, setInStore } from "./database";
import {
  getShuffledTopArtists,
  getShuffledTopTracks,
  getUserTopGenres,
} from "./indexedDbHelpers";

export function showSuccessNotif(title: string, message: string) {
  notifications.show({
    color: "green",
    title: title,
    message: message,
  });
}

export function showErrorNotif(title: string, message: string) {
  notifications.show({
    color: "red",
    title: title,
    message: message,
    autoClose: 5000,
  });
}

export function showWarnNotif(title: string, message: string) {
  notifications.show({
    color: "yellow",
    title: title,
    message: message,
    autoClose: 5000,
  });
}

// After verifying a track's Spotify saved status, sync with IDB library of saved tracks
// If a user updates their saved tracks outside of Cadence,
// this ensures when a track is shown to the user the saved status displayed is accurate
// and keeps IDB up to date
// Returns 1 if a track was added, -1 if a track was removed, 0 if no action was taken
export async function syncSpotifyAndIdb(
  track: TrackObject,
  saved: boolean | undefined
): Promise<number> {
  // Check if the track exists in the IDB library
  // Although getFromStore may return Track or Artist, we know it always returns a TrackObject from the "library"
  const savedInDb = (await getTrackFromStore("savedTracks", track.track.id)) as
    | TrackObject
    | undefined;

  // Ensure IDB matches Spotify
  // If song saved in Spotify but not in IDB, add to IDB
  // (e.g. a top track that wasn't saved when the database was initially loaded,
  // but the user has since saved it in Spotify)
  if (saved && !savedInDb) {
    await setInStore("savedTracks", track);
    return 1;
  } else if (!saved && savedInDb) {
    // If song not saved in Spotify but saved in IDB, rm from IDB
    await deleteFromStore("savedTracks", track.track.id);
    console.log("removed track from IDB");
    // if it's removed, remove it from matching tracks as well if user is filtering "saved tracks"
    return -1;
  }
  return 0;
}

export function calculatePlaylistTime(
  playlist: Map<string, TrackObject>
): string {
  let totalTimeMs = 0;
  for (const value of playlist.values()) {
    const trackTime = value.track.duration_ms;
    totalTimeMs += trackTime;
  }

  // Convert ms to h/m/s
  return msToPlaylistTime(totalTimeMs);
}

export function msToPlaylistTime(ms: number): string {
  // Convert ms to seconds, rounding
  let totalSeconds = Math.round(ms / 1000);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours.toString()} hr ${minutes.toString()} min`
    : `${minutes.toString()} min ${seconds.toString()} sec`;
}

export function msToTrackTime(ms: number): string {
  // Convert ms to seconds, rounding
  let totalSeconds = Math.round(ms / 1000);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes.toString()}:${seconds.toString().padStart(2, "0")}`;
}

// Gets a random number between two values
export function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function getRandomInt(min: number, max: number): number {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

// Shuffles array
export function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((item) => ({ sort: Math.random(), value: item }))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
}

export async function generateSeeds(chosenSeeds: ChosenSeeds | undefined) {
  const topTracks: string[] | null = await getShuffledTopTracks();
  const topArtists: string[] | null = await getShuffledTopArtists();

  if (!topTracks || !topArtists) return null;

  let trackIds: string | null;
  let artistIds: string | null;
  let genres: string | null;

  // If no custom seeds are provided from the form, generate seeds from user's listening habits
  if (!chosenSeeds) {
    const topGenres: string[] | null = await getUserTopGenres();
    if (!topGenres) return null;

    // Select randomly from topTracks, topArtists, and topGenres (random to offer user variety)
    // Create 5 total seeds from at least two of the above categories (as per Spotify API requirements)

    // Get a random number between 0 and 5
    // (4 tracks max guarantees at least one other category is included)
    const numberTracks = getRandomInt(0, 5);

    // If no tracks, guarantee second category by preventing 5 artists
    const numberArtists =
      numberTracks === 0
        ? getRandomInt(1, 4 - numberTracks)
        : getRandomInt(0, 5 - numberTracks);

    // Whatever is left to genres
    const numberGenres = 5 - numberTracks - numberArtists;

    trackIds =
      numberTracks > 0 ? topTracks.slice(0, numberTracks).join(",") : null;
    artistIds =
      numberArtists > 0 ? topArtists.slice(0, numberArtists).join(",") : null;
    genres =
      numberGenres > 0 ? topGenres.slice(0, numberGenres).join(",") : null;
  } else {
    trackIds = chosenSeeds.tracks.join(",");
    artistIds = chosenSeeds.artists.join(",");
    genres = chosenSeeds.genres.join(",");
  }

  return {
    trackIds: trackIds || null,
    artistIds: artistIds || null,
    genres: genres || null,
  };
}

// Converts form filter keys to snake case (e.g. minTempo -- min_tempo)
// And values to strings (e.g. 180 --> "180")
export function parseFilters(filters: NumericFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([_, value]) => value != undefined)
      .map(([key, value]) => [
        key.replace(/([A-Z])/g, "_$1").toLowerCase(),
        String(value),
      ])
  );
}

interface tag {
  count: number;
  name: string;
}

// Returns a sorted array of a recording's tags based on count
export function extractTags(tags: tag[]): string[] {
  // Sort tags in descending order by count
  tags.sort((a, b) => b.count - a.count);

  const tagNames: string[] = [];
  for (const tag of tags) {
    tagNames.push(tag.name);
  }

  return tagNames;
}
