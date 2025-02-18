const express = require("express");
const router = express.Router();
const { fetchPlaylist, fetchPlaylistItems } = require("../../helpers/spotify");

router.get("/playlist", async function (req, res) {
  const { playlistId, accessToken } = req.query;

  const result = await fetchPlaylist(playlistId, accessToken);

  if (result.error) {
    return res.status(result.status).json({ error: result.message });
  }

  const name = result.data.name;
  res.json({ name });
});

router.get("/playlistItems", async function (req, res) {
  const { playlistId, accessToken } = req.query;
  const tracks = await fetchPlaylistItems(playlistId, accessToken);
  if (tracks) {
    res.json({ items: tracks });
  } else {
    res.status(500).json({ error: "Could not fetch playlist tracks" });
  }
});

module.exports = router;
