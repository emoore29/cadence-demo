import axios from "axios";
import { User } from "../types/types";

// Fetch user data
export async function fetchUserData(token: string): Promise<User | null> {
  try {
    const result = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = result.data;
    return user;
  } catch (error) {
    console.error("There was an error fetching user data:", error);
    return null;
  }
}

// Get user's library size
export async function getUserLibrarySize(
  token: string
): Promise<number | null> {
  try {
    const result = await axios.get("https://api.spotify.com/v1/me/tracks", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const librarySize = result.data.total;
    return librarySize;
  } catch (error) {
    console.error("There was an error fetching the user's library:", error);
    return null;
  }
}

// Get tokens when user has logged in
export function loginTokens(): string[] | null {
  const hash = window.location.hash;
  const accessToken = new URLSearchParams(hash.replace("#", "?")).get(
    "access_token"
  );
  const refreshToken = new URLSearchParams(hash.replace("#", "?")).get(
    "refresh_token"
  );
  const expiresIn = new URLSearchParams(hash.replace("#", "?")).get(
    "expires_in"
  );

  if (accessToken && refreshToken && expiresIn) {
    return [accessToken, refreshToken, expiresIn];
  } else {
    return null;
  }
}

// Store tokens in local storage
export function storeTokens(
  access: string,
  refresh: string,
  expiresIn: string
): void {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  const expiryTime = Date.now() + parseInt(expiresIn, 10);
  localStorage.setItem("token_expiry", expiryTime.toString());
}
