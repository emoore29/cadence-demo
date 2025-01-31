import {
  AcousticBrainzFeatures,
  Artist,
  StoreName,
  TopTrackObject,
  Track,
  TrackFeatures,
  TrackObject,
  TrackStoreName,
} from "@/types/types";
import { DBSchema, IDBPDatabase, openDB } from "idb";

// Functions to set up and delete database, and store, delete, and retrieve items from database

interface MyDB extends DBSchema {
  savedTracks: {
    key: string; // track id
    value: {
      track: Track;
      features: AcousticBrainzFeatures;
    };
  };
  topArtists: {
    key: string; // artist id
    value: Artist;
  };
  topTracks: {
    key: string; // track id
    value: {
      track: Track;
      features: AcousticBrainzFeatures;
      order: number;
    };
  };
}

// Creates IndexedDB
export async function setUpDatabase(): Promise<IDBPDatabase<MyDB>> {
  // Opens the first version of the 'cadence' database.
  // If the database does not exist, it will be created.
  const db = await openDB<MyDB>("cadence", 1, {
    upgrade(db) {
      // Create an object store for saved tracks
      if (!db.objectStoreNames.contains("savedTracks")) {
        db.createObjectStore("savedTracks", { keyPath: "track.id" });
      }

      // Create an object store for top artists
      if (!db.objectStoreNames.contains("topArtists")) {
        db.createObjectStore("topArtists", { keyPath: "id" });
      }

      // Create an object store for top tracks
      if (!db.objectStoreNames.contains("topTracks")) {
        db.createObjectStore("topTracks", { keyPath: "track.id" });
      }
    },
  });
  return db;
}

// Get a track from a track store based on a key
export async function getTrackFromStore(
  storeName: "savedTracks" | "topTracks",
  key: string
): Promise<TrackObject | Track | Artist | undefined> {
  const db = await setUpDatabase();
  return db.get(storeName, key);
}

// Set a key-val pair in any store
export async function setInStore(
  storeName: StoreName,
  value: TrackObject | TopTrackObject | Artist
) {
  const db = await setUpDatabase();
  return db.put(storeName, value);
}

// Remove a key-val pair from any store
export async function deleteFromStore(
  storeName: StoreName,
  key: string
): Promise<void> {
  const db = await setUpDatabase();
  return db.delete(storeName, key);
}

// Remove a store
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await setUpDatabase();
  return db.clear(storeName);
}

// Get all keys from a store
export async function getAllKeysFromStore(
  storeName: StoreName
): Promise<string[]> {
  const db = await setUpDatabase();
  return db.getAllKeys(storeName);
}

// Gets all values from store
export async function getAllFromStore(storeName: StoreName): Promise<any[]> {
  const db = await setUpDatabase();
  return db.getAll(storeName);
}

export async function deleteDatabase(): Promise<void> {
  const databaseName = "cadence";

  // Close open connections to db
  const db = await openDB(databaseName);
  db.close();

  // Return promise to delet database
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(databaseName);

    deleteRequest.onsuccess = () => {
      console.log(`Database '${databaseName}' deleted successfully.`);
      resolve();
      // Reload the tab after successful deletion
      location.reload();
    };

    deleteRequest.onerror = (event) => {
      console.error(`Error deleting database '${databaseName}':`, event);
      reject(event);
    };

    deleteRequest.onblocked = () => {
      console.warn(
        `Database deletion is blocked. Close all connections to '${databaseName}' and try again.`
      );
    };
  });
}
