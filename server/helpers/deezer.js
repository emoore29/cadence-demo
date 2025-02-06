const axios = require("axios");

async function searchTrackDeezer(trackName, trackArtist, trackAlbum) {
  console.log(trackName, trackArtist);

  // Search for a track with album, return preview_url if available
  try {
    const res = await axios.get(
      `https://api.deezer.com/search?q=album:"${trackAlbum}"track:"${trackName}"`
    );
    const resultReceieved = Math.floor(Date.now() / 1000); // Convert ms to sec to match expiry units in preview url

    const results = res.data.data;
    const numResults = res.data.total;
    if (numResults == 0) {
      console.warn(
        `Could not find Deezer track for ${trackName} by ${trackArtist}`
      );
      return null;
    }

    // Deezer search results may be inconsistent
    // Verify track name, artist, and album before setting preview
    let previewUrl = null;
    for (const result of results) {
      if (result.title != trackName || result.artist.name != trackArtist) {
        continue;
      }
      previewUrl = result.preview;
      break;
    }

    return previewUrl;
  } catch (error) {
    console.error(`Error searching for track in Deezer.`, error);
    return null;
  }
}

module.exports = {
  searchTrackDeezer,
};
