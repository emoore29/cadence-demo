const express = require("express");
const router = express.Router();
const { fetchPlaylist, fetchPlaylistItems } = require("../../helpers/spotify");

router.get("/playlist", async function (req, res) {
  const { playlistId, accessToken } = req.query;

  const playlist = await fetchPlaylist(playlistId, accessToken);

  if (playlist) {
    const name = playlist.name;
    const id = playlist.id;
    const items = await fetchPlaylistItems(playlistId, accessToken);

    res.json({ name, id, items });
  } else {
    res.status(500).json({ error: `Unable to fetch playlist data` });
  }
});

module.exports = router;
