const axios = require("axios");

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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMBIDandTags(isrc) {
  try {
    const res = await axios.get(
      `http://musicbrainz.org/ws/2/recording/?query=isrc:${isrc}&fmt=json`
    );

    const numResults = res.data.count;
    if (numResults == 0) {
      console.warn(`Could not find mbid for track ISRC ${isrc}`);
      return null;
    }

    const mbid = res.data.recordings[0].id;
    let tags = [];
    for (const recording of res.data.recordings) {
      if (recording.tags) {
        tags = extractTags(recording.tags);
      }
    }

    // Wait >1 sec to avoid hitting rate limit for MusicBrainz
    await delay(1050);
    return { mbid: mbid, tags: tags };
  } catch (error) {
    console.error(
      `Error fetching or processing result from MusicBrainz for track ${isrc}. MusicBrainz Server may be busy.`,
      error
    );
    return null;
  }
}

module.exports = {
  fetchMBIDandTags,
};
