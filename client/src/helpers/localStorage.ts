// Helper functions for storing, retrieving, and clearing data from local storage.

// Stores a key-value pair in local storage
export function storeDataInLocalStorage(key: string, data: any): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Clears everything from local storage, used when user logs out
export function clearLocalStorage(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_expiry");
  localStorage.removeItem("user_data");
  localStorage.removeItem("lib_size");
  localStorage.removeItem("library_was_stored");
  localStorage.removeItem("top_tracks_were_stored");
}

// Items are set to "true" in localStorage when they are stored in database
// Checks if an item was stored in the database by checking localStorage
export function wasItemStoredInDb(item: string): boolean {
  const stored: string | null = localStorage.getItem(item);
  if (stored === "true") {
    return true;
  } else {
    return false;
  }
}

// Stores tokens in local storage, used when user logs in
export function storeTokens(
  access: string,
  refresh: string,
  expiresIn: string
): void {
  console.log("Storing tokens:", access, refresh, expiresIn);
  const expiryTime = Date.now() + Number(expiresIn) * 1000;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("token_expiry", expiryTime.toString());
}

// Gets an item from local storage
export function getItemFromLocalStorage(item: string): string | null {
  const itemValue = localStorage.getItem(item);
  if (itemValue) {
    return itemValue;
  } else {
    console.error(`Error retrieving ${item} from local storage.`);
    return null;
  }
}
