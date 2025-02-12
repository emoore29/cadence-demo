const express = require("express");
const router = express.Router();
const axios = require("axios");

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

// Refreshes access token
router.get("/refresh_token", async function (req, res) {
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

module.exports = router;
