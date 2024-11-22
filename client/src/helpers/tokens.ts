import axios from "axios";
import { storeTokens } from "./localStorage";

// If the current access token has expired, fetches and stores new tokens
export async function handleTokens(): Promise<void> {
  const storedAccessToken: string | null = localStorage.getItem("access_token");
  const storedExpiry: string | null = localStorage.getItem("token_expiry");
  console.log("Handle tokens executed");
  if (
    !storedAccessToken ||
    storedAccessToken === "undefined" ||
    !storedExpiry ||
    storedExpiry === "undefined" ||
    storedExpiry === "NaN"
  ) {
    // Either user has not logged in, or there is an error
    console.error(
      "Couldn't find stored access token or expiry in local storage."
    );
  }

  const now = Date.now();
  const expiryTime = parseInt(storedExpiry!, 10);

  console.log("Now:", new Date(now).toLocaleString());
  console.log("Expiry time:", new Date(expiryTime).toLocaleString());

  // Add a 10 second buffer such that the token refreshes just before it expires.
  // Allows for delays in fetching new tokens from Spotify
  if (now > expiryTime - 10000) {
    console.log("Tokens out of date. Updating...");
    const tokens: string[] | null = await getNewTokens();
    if (tokens) {
      const [accessToken, newRefreshToken, expiresIn] = tokens;
      storeTokens(accessToken, newRefreshToken, expiresIn);
    } else {
      // If new tokens couldn't be retrieved for some reason, get user to log in again
      console.log("Your session has expired. Please log in again.");
    }
  } else {
    console.log("Access token is up to date.");
  }
}

// Fetches new tokens from backend /refresh_token API endpoint
export async function getNewTokens(): Promise<string[] | null> {
  // Sends request to backend for new access token
  const refreshToken: string | null = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    console.error("No refresh token found in local storage.");
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

    console.log("New tokens fetched:", accessToken, newRefreshToken, expiresIn);
    return [accessToken, newRefreshToken, expiresIn];
  } catch (error) {
    console.error("There was an error fetching a new access token:", error);
    return null;
  }
}
