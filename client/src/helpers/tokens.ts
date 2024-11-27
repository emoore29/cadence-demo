import axios from "axios";
import { checkTokenValidity, storeTokens } from "./localStorage";
import { showErrorNotif } from "./general";

// Create Singleton promise
// Never more than one instance of tokenPromise
// Multiple calls of handleTokens will not create multiple API calls
let tokenPromise: Promise<void> | null = null;

// If the current access token has expired, fetches and stores new tokens
export async function handleTokens(): Promise<void> {
  if (!tokenPromise) {
    tokenPromise = (async () => {
      const isTokenInvalid = checkTokenValidity();
      if (isTokenInvalid) {
        const tokens: string[] | null = await getNewTokens();
        if (tokens) {
          const [accessToken, newRefreshToken, expiresIn] = tokens;
          storeTokens(accessToken, newRefreshToken, expiresIn);
        }
      }
    })();
  }
  return tokenPromise;
}

// Fetches new tokens from backend /refresh_token API endpoint
export async function getNewTokens(): Promise<string[] | null> {
  // Sends request to backend for new access token
  const refreshToken: string | null = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    showErrorNotif("", "Your session has expired. Please log in again.");
    return null;
  }

  try {
    const response = await axios.get("http://localhost:3000/refresh_token", {
      params: {
        refresh_token: refreshToken,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: expiresIn,
    } = response.data;

    return [accessToken, newRefreshToken, expiresIn];
  } catch (error) {
    console.error("Something went wrong continuing login:", error);
    return null;
  }
}
