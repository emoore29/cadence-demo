import { Artist, Track, TrackFeatures, TrackObject } from "@/types/types";
import { DBSchema, IDBPDatabase, openDB } from "idb";

// Functions to set up and delete database, and store, delete, and retrieve items from database

export type StoreName =
  | "library"
  | "topArtists"
  | "topTracks"
  | "recommendations"
  | "demoTracks";

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
    value: {
      track: Track;
      features: TrackFeatures;
      order: number;
    };
  };
  recommendations: {
    key: string; // track id
    value: {
      track: Track;
      features: TrackFeatures;
    };
  };
  demoTracks: {
    key: string; // track id
    value: {
      track: Track;
      features: TrackFeatures;
    };
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
        db.createObjectStore("topTracks", { keyPath: "track.id" });
      }

      // Create an object store for recommendations
      if (!db.objectStoreNames.contains("recommendations")) {
        db.createObjectStore("recommendations", { keyPath: "track.id" });
      }

      // Create an object store for demo tracks
      if (!db.objectStoreNames.contains("demoTracks")) {
        db.createObjectStore("demoTracks", { keyPath: "track.id" });
      }
    },
  });
  return db;
}

// Get from a particular store based on a key (e.g. find a song from library with its id)
export async function getFromStore(
  storeName: StoreName,
  key: string
): Promise<TrackObject | Track | Artist | undefined> {
  const db = await setUpDatabase();
  return db.get(storeName, key);
}

// Set a key-val pair in a given store
export async function setInStore(
  storeName: StoreName,
  value:
    | {
        track: Track;
        features: TrackFeatures;
        saved?: boolean;
        order?: number;
      }
    | Artist
) {
  const db = await setUpDatabase();
  return db.put(storeName, value);
}

// Remove a key-val pair in a given store
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
