const axios = require("axios");

async function searchTrackDeezer(trackName, trackArtist) {
  // Search for a track with name and artist, return preview_url if available
  try {
    const res = await axios.get(
      `https://api.deezer.com/search?q=artist:"${trackArtist}"track:"${trackName}"`
    );
    const numResults = res.data.total;
    if (numResults == 0) {
      console.warn(
        `Could not find Deezer track for ${trackName} by ${trackArtist}`
      );
      return null;
    }
    const preview = res.data.data[0].preview;
    return preview;
  } catch (error) {
    console.error(`Error searching for track in Deezer.`, error);
    return null;
  }
}

module.exports = {
  searchTrackDeezer,
};
