require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");
var cookieParser = require("cookie-parser");
const { searchTrackDeezer } = require("./helpers/deezer");
const { fetchFeatures } = require("./helpers/acousticBrainz");
const { features } = require("process");
const port = 3000;
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = "http://localhost:3000/callback";
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true, // allow cookies
};

const app = express();
const stateKey = "spotify_auth_state";

const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString("hex").slice(0, length);
};

app.use(cors(corsOptions)).use(cookieParser());

// Redirects client to Spotify authorization with appropriate query parameters
app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state); // Send the state key to the browser

  console.log("User logging in, redirect to spotify to grant authorization");

  var scope =
    "user-read-private user-read-email user-top-read playlist-read-private playlist-modify-private playlist-modify-public user-library-read user-library-modify";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      new URLSearchParams({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri, // redirects to "/callback"
        state: state,
        show_dialog: true,
      })
  );
});

// Exchanges authorization code for access token and refresh token
app.get("/callback", async function (req, res) {
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
        "http://localhost:5173/#" +
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

// Refreshes access token
app.get("/refresh_token", async function (req, res) {
  const now = new Date();
  const currentTime = now.toLocaleString();

  var client_refresh_token = req.query.refresh_token;

  console.log(`${currentTime}: User requested new access token`);

  try {
    const authResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: client_refresh_token,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
        timeout: 5000,
      }
    );

    var updated_refresh_token;
    const access_token = authResponse.data.access_token;
    const expires_in = authResponse.data.expires_in;
    var refresh_token;
    // If a new token is sent, use that, otherwise use the old token
    if (authResponse.data.refresh_token) {
      updated_refresh_token = true;
      refresh_token = authResponse.data.refresh_token;
    } else {
      updated_refresh_token = false;
      refresh_token = client_refresh_token;
    }

    res.send({
      access_token: access_token,
      refresh_token: refresh_token,
      expires_in: expires_in,
    });

    console.log(`${currentTime}: Sent new access token to client.`);
  } catch (error) {
    console.error(
      "Something went wrong fetching new access token from Spotify.",
      error
    );
  }
});

app.get("/search_deezer", async function (req, res) {
  const { trackName, trackArtist, trackAlbum } = req.query;
  const previewUrl = await searchTrackDeezer(
    trackName,
    trackArtist,
    trackAlbum
  );
  if (previewUrl) {
    res.json({ previewUrl });
  } else {
    res.status(500).json({ error: "Unable to fetch Deezer track preview" });
  }
});

app.get("/features", async function (req, res) {
  const { mbid } = req.query;

  const featuresResponse = await fetchFeatures(mbid);

  if (featuresResponse) {
    res.json({ featuresResponse });
  } else {
    res.status(500).json({ error: `Unable to fetch track features (${mbid})` });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
