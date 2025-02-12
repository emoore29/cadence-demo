const express = require("express");
const router = express.Router();
const axios = require("axios");

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

async function getAccessToken() {
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token", error);
    return null;
  }
}

router.get("/guest_token", async function (req, res) {
  const now = new Date();
  const currentTime = now.toLocaleString();
  console.log(`${currentTime}: Client requested new guest token`);

  const token = await getAccessToken();
  if (token) {
    console.log(`${currentTime}: Sent new guest token to client`);
    res.json({ token });
  } else {
    res.status(500).json({ error: `Unable to fetch guest access token` });
  }
});

module.exports = router;
