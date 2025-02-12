const express = require("express");
const router = express.Router();
const { searchTrackDeezer } = require("../../helpers/deezer");

router.get("/search_deezer", async function (req, res) {
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

module.exports = router;
