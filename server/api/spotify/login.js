const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

const stateKey = "spotify_auth_state";
const redirect_uri = "http://localhost:3000/api/spotify/callback";

const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString("hex").slice(0, length);
};

// Redirects client to Spotify authorization with appropriate query parameters
router.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state); // Send the state key to the browser

  const now = new Date();
  const currentTime = now.toLocaleString();
  console.log(
    `${currentTime}: User logging in, redirect to spotify to grant authorization`
  );

  var scope =
    "user-read-private user-read-email user-top-read playlist-read-private playlist-modify-private playlist-modify-public user-library-read user-library-modify";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      new URLSearchParams({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri, // redirects to /api/callback
        state: state,
        show_dialog: true,
      })
  );
});

module.exports = router;
