require("dotenv").config();
const express = require("express");
const router = express.Router();
const axios = require("axios");
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const stateKey = "spotify_auth_state";

const redirect_uri =
  process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_SPOTIFY_REDIRECT_URI
    : process.env.DEVELOPMENT_SPOTIFY_REDIRECT_URI;

const homepage =
  process.env.NODE_ENV === "production"
    ? "https://cadencetracks.com"
    : "http://localhost:5173";

// Exchanges authorization code for access token and refresh token
router.get("/callback", async function (req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  // Check that the state given by Spotify is the same as the storedState from the original authorization request
  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        new URLSearchParams({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey); // Remove cookie once it has served its purpose

    // Spotify example code uses request package, which is deprecated
    // Following code uses axios in a try/catch block to send the post request instead
    // json: true is not needed because axios automatically parses JSOn responses

    try {
      const authResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          code: code,
          redirect_uri: redirect_uri,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(client_id + ":" + client_secret).toString("base64"),
          },
        }
      );

      const { access_token, refresh_token, expires_in } = authResponse.data;

      // Request user data from Spotify
      const userResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const now = new Date();
      const currentTime = now.toLocaleString();

      console.log(
        `${currentTime}: ${userResponse.data.display_name} successfully retrieved tokens from Spotify API.`
      );

      // Redirect the user back to client app with tokens
      res.redirect(
        `${homepage}#` +
          new URLSearchParams({
            access_token: access_token,
            refresh_token: refresh_token,
            expires_in: expires_in,
          })
      );

      console.log(`${currentTime}: Redirected user to client with tokens.`);
    } catch (error) {
      console.error(error);
      res.redirect(
        "/#" +
          new URLSearchParams({
            error: "invalid_token",
          })
      );
    }
  }
});

module.exports = router;
