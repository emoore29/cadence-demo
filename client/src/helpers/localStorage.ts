// Helper functions for storing, retrieving, and clearing data from local storage.

import { showErrorNotif } from "./general";

// Stores a key-value pair in local storage
export function storeDataInLocalStorage(key: string, data: any): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Items are set to "true" in localStorage when they are stored in database
// Checks if an item was stored in the database by checking localStorage
export function wasLibraryStoredInDatabase(): boolean {
  const stored: string | null = localStorage.getItem("library_was_stored");
  if (stored === "true") {
    return true;
  } else {
    return false;
  }
}

// Stores tokens and expiry in local storage
export function storeTokens(
  access: string,
  refresh: string,
  expiresIn: string
): void {
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
    return null;
  }
}

// Returns true if token is invalid
export function checkTokenValidity(): boolean {
  const storedAccessToken: string | null = localStorage.getItem("access_token");
  const storedExpiry: string | null = localStorage.getItem("token_expiry");
  const storedUser: string | null = localStorage.getItem("user_data");
  if (
    !storedAccessToken ||
    storedAccessToken === "undefined" ||
    !storedExpiry ||
    storedExpiry === "undefined" ||
    storedExpiry === "NaN"
  ) {
    if (storedUser) {
      showErrorNotif(
        "Error",
        "Couldn't find stored access token or expiry. Please log out and log in again."
      );
    }
  }

  const now = Date.now();
  const expiryTime = Number(storedExpiry);
  return now > expiryTime - 10000;
}

// Returns true if guest_token is invalid
export function checkGuestToken(): boolean {
  const storedGuestToken: string | null = localStorage.getItem("guest_token");
  const storedGuestExpiry: string | null = localStorage.getItem("guest_expiry");
  const now = Date.now();
  const expiry: number = Number(storedGuestExpiry);
  // Reduce expiry by 10 seconds to allow 10 second buffer to fetch new token before it actually expires
  if (!storedGuestToken || now > expiry - 10000) {
    return true;
  } else {
    return false;
  }
}
