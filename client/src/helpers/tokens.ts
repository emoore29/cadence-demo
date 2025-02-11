import axios from "axios";
import {
  checkGuestToken,
  checkTokenValidity,
  storeTokens,
} from "./localStorage";
import { showErrorNotif } from "./general";

// Create Singleton promise
// Never more than one instance of tokenPromise
// Multiple calls of handleTokens will not create multiple API calls
let accessTokenPromise: Promise<void> | null = null;
let guestTokenPromise: Promise<void> | null = null;

// If the current access token has expired, fetches and stores new tokens
export async function handleAccessToken(): Promise<void> {
  console.log("handle access tokens ran");
  if (!accessTokenPromise) {
    accessTokenPromise = (async () => {
      // Check user access token
      const accessTokenInvalid = checkTokenValidity();
      if (accessTokenInvalid) {
        const tokens: string[] | null = await getNewAccessToken();
        if (tokens) {
          const [accessToken, newRefreshToken, expiresIn] = tokens;
          storeTokens(accessToken, newRefreshToken, expiresIn);
        }
      }
    })();
  }
  return accessTokenPromise;
}

// If current guest token has expired, fetches and stores new token
export async function handleGuestToken(): Promise<void> {
  if (!guestTokenPromise) {
    guestTokenPromise = (async () => {
      // Check guest access token
      console.log("checking guest token");
      const guestTokenInvalid = checkGuestToken();
      if (guestTokenInvalid) {
        console.log("Guest token invalid");
        await getNewGuestToken();
      } else {
        console.log("Guest token valid");
      }
    })();
  }
  return guestTokenPromise;
}

// Fetches new tokens from backend /refresh_token API endpoint
export async function getNewAccessToken(): Promise<string[] | null> {
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

// Fetches new guest token from backend
export async function getNewGuestToken(): Promise<boolean | null> {
  try {
    const res = await axios.get("http://localhost:3000/guest_token");
    console.log("response from server", res);
    const token: string = res.data.token;
    const expiry: number = Date.now() + 3600 * 1000;

    localStorage.setItem("guest_token", token);
    localStorage.setItem("guest_expiry", expiry.toString());
    return true;
  } catch (error) {
    console.error("Something went wrong asking server for access token");
    return false;
  }
}
