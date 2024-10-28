import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Track, Artist, TrackFeatures, SampleTrack } from "@/types/types";

type StoreName = "library" | "topArtists" | "topTracks";

interface MyDB extends DBSchema {
  library: {
    key: string; // track id
    value: {
      track: Track;
      features: TrackFeatures;
    };
  };
  topArtists: {
    key: string; // artist id
    value: Artist;
  };
  topTracks: {
    key: string; // track id
    value: Track;
  };
}

// Creates IndexedDB
export async function setUpDatabase(): Promise<IDBPDatabase<MyDB>> {
  // Opens the first version of the 'cadence' database.
  // If the database does not exist, it will be created.
  const db = await openDB<MyDB>("cadence", 1, {
    upgrade(db) {
      // Create an object store for songs
      if (!db.objectStoreNames.contains("library")) {
        db.createObjectStore("library", { keyPath: "track.id" });
      }

      // Create an object store for top artists
      if (!db.objectStoreNames.contains("topArtists")) {
        db.createObjectStore("topArtists", { keyPath: "id" });
      }

      // Create an object store for top tracks
      if (!db.objectStoreNames.contains("topTracks")) {
        db.createObjectStore("topTracks", { keyPath: "id" });
      }
    },
  });
  return db;
}

// Get from a particular store based on a key (e.g. find a song from library with its id)
export async function getFromStore(storeName: StoreName, key: string) {
  const db = await setUpDatabase();
  return db.get(storeName, key);
}

// Set a key-val pair in a given store
export async function setInStore(
  storeName: StoreName,
  value: {
    track: Track;
    features: TrackFeatures;
  }
) {
  const db = await setUpDatabase();
  return db.put(storeName, value);
}

// Remove a key-val pair in a given store
export async function deleteFromStore(storeName: StoreName, key: string) {
  const db = await setUpDatabase();
  return db.delete(storeName, key);
}

// Remove a store
export async function clearStore(storeName: StoreName) {
  const db = await setUpDatabase();
  return db.clear(storeName);
}

// Get all keys from a store
export async function getAllKeysFromStore(storeName: StoreName) {
  const db = await setUpDatabase();
  return db.getAllKeys(storeName);
}
