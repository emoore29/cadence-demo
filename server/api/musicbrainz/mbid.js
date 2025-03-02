require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../../db");
const { default: axios } = require("axios");

router.get("/mbid", async function (req, res) {
  const { isrcs } = req.query;
  let mbData = {};

  if (process.env.NODE_ENV != "production") {
    // Development - fetch from production API endpoint
    try {
      const res = await getMbidAndTagsFromProduction(isrcs);
      mbData = res.mbData;
    } catch (error) {
      console.error("Error fetching mbids from production API endpoint");
    }
  } else {
    // Production - fetch directly from database
    const isrcArr = isrcs.split(",");

    if (isrcArr.length > 25) {
      res.status(400).json({ message: "Too many ids requested." });
    }
    for (const isrc of isrcArr) {
      const mbTrackData = await getMbidAndTags(isrc);
      mbData[isrc] = mbTrackData;
    }
  }

  if (mbData) {
    res.json({ mbData });
  } else {
    res.status(500).json({ error: `Unable to fetch MusicBrainz data` });
  }
});

// Gets mbid and tags using production API endpoint
async function getMbidAndTagsFromProduction(isrc) {
  try {
    const res = await axios.get(
      `https://cadencetracks.com/api/musicbrainz/mbid?isrcs=${isrc}`
    );
    return res.data;
  } catch (error) {
    console.error("Could not get result from server for MBID");
  }
}

async function getMbidAndTags(isrc) {
  const client = await db.connect();

  try {
    // Get recordingId from ISRC
    const recordingRes = await client.query(
      `SELECT recording FROM musicbrainz.isrc WHERE isrc =$1`,
      [isrc]
    );
    const recordingId = recordingRes.rows[0]
      ? recordingRes.rows[0].recording
      : null;
    if (!recordingId) return null;

    // Get MBID from recordingId
    const mbidRes = await client.query(
      `SELECT * FROM musicbrainz.recording WHERE id=$1`,
      [recordingId]
    );
    const mbid = mbidRes.rows[0] ? mbidRes.rows[0].gid : null;
    if (!mbid) return null;

    // Get tags from recordingId
    const result = await client.query(
      `SELECT * FROM musicbrainz.recording_tag WHERE recording=$1`,
      [recordingId]
    );
    const tags = result.rows;
    if (!tags) return null;

    // Get name and count of each tag and add to array
    const tagArr = []; // Array will be the same structure as that from the API [{count: count, name: name}...]
    for (const tagObj of tags) {
      const tagId = tagObj.tag;
      const count = tagObj.count;
      const tagRes = await client.query(
        `SELECT * from musicbrainz.tag WHERE id=$1`,
        [tagId]
      );
      const name = tagRes.rows[0] ? tagRes.rows[0].name : null;
      if (!name) continue;
      tagArr.push({ count, name });
    }
    const processedTags = extractTags(tagArr);
    return { mbid, processedTags };
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Returns a sorted array of a recording's tags based on count
function extractTags(tags) {
  // Sort tags in descending order by count
  tags.sort((a, b) => b.count - a.count);

  const tagNames = [];
  for (const tag of tags) {
    tagNames.push(tag.name);
  }

  return tagNames;
}

module.exports = router;
