import axios from "axios";

export const checkTokenExpiry = () => {
  // Checks if the current access token has expired
  // If so, runs updateTokens()
  const storedAccessToken = localStorage.getItem("access_token");
  const tokenExpiry = localStorage.getItem("token_expiry");

  if (storedAccessToken && tokenExpiry) {
    const now = Date.now();
    if (now > parseInt(tokenExpiry, 10)) {
      updateTokens();
    }
  }
};

export async function updateTokens() {
  // Sends request to backend for new access token
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    console.error("No refresh token found in local storage.");
    return;
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
    const { access_token, refresh_token, expires_in } = response.data;
    const expiresIn = expires_in || 3600;
    const expiryTime = Date.now() + expiresIn * 1000; // Convert to milliseconds
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("token_expiry", expiryTime.toString());
  } catch (error) {
    console.error("There was an error fetching a new access token:", error);
  }
}
