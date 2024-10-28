import axios from "axios";
import { storeTokens } from "./frontend";

// If the current access token has expired, fetches and stores new tokens
export async function handleTokens(): Promise<void> {
  const storedAccessToken: string | null = localStorage.getItem("access_token");
  const storedExpiry: string | null = localStorage.getItem("token_expiry");

  if (!storedAccessToken || !storedExpiry) {
    // Either user has not logged in, or there is an error
    console.error(
      "Couldn't find stored access token or expiry in local storage."
    );
  }

  const now = Date.now();
  const expiryTime = parseInt(storedExpiry!, 10);

  if (now > expiryTime) {
    console.log("Tokens out of date. Updating...");
    const tokens = await getNewTokens();
    if (tokens) {
      const [accessToken, newRefreshToken, expiresIn] = tokens;
      console.log("storing tokens. access token:", accessToken);
      storeTokens(accessToken, newRefreshToken, expiresIn);
    }
  }
}

// Fetches and returns new tokens
export async function getNewTokens(): Promise<string[] | null> {
  // Sends request to backend for new access token
  const refreshToken = localStorage.getItem("refresh_token");
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
    const { accessToken, newRefreshToken, expiresIn } = response.data;
    return [accessToken, newRefreshToken, expiresIn];
  } catch (error) {
    console.error("There was an error fetching a new access token:", error);
    return null;
  }
}
