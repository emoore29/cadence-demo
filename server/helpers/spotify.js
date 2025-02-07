const axios = require("axios");

async function fetchPlaylist(playlistId, accessToken) {
  // Search for a playlist with id
  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return res.data;
  } catch (error) {
    console.error(`Error searching for Spotify playlist.`, error);
    return null;
  }
}

module.exports = {
  fetchPlaylist,
};
