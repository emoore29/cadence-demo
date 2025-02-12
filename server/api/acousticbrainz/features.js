const express = require("express");
const router = express.Router();
const { fetchFeatures } = require("../../helpers/acousticBrainz");

router.get("/features", async function (req, res) {
  const { mbids } = req.query; // Comma separated strings

  const mbidArr = mbids.split(",");

  if (mbidArr.length > 25) {
    res.status(400).json({ message: "Invalid request." });
  }

  const features = await fetchFeatures(mbidArr);

  if (features) {
    res.json({ features });
  } else {
    res.status(500).json({ error: `Unable to fetch track features` });
  }
});

module.exports = router;
