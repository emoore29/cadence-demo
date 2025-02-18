const axios = require("axios");

async function fetchPlaylist(playlistId, accessToken) {
  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return { data: res.data };
  } catch (error) {
    console.error(`Error searching for Spotify playlist:`, {
      status: error.response?.status,
      message: error.response?.data?.error?.message || error.message,
    });
    return {
      error: true,
      status: error.response?.status || 500,
      message: error.response?.data?.error.message || error.message,
    };
  }
}

async function fetchPlaylistItems(playlistId, accessToken) {
  let playlistTracks = [];
  // Initialise nextUrl to first api fetch
  let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  try {
    // Total limit is 1000 to prevent extremely long load times
    while (nextUrl && playlistTracks.length < 1000) {
      const res = await axios.get(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      playlistTracks = [...playlistTracks, ...res.data.items];
      nextUrl = res.data.next;
    }
    return playlistTracks;
  } catch (error) {
    console.error(`Error searching for Spotify playlist.`, error);
    return null;
  }
}

module.exports = {
  fetchPlaylist,
  fetchPlaylistItems,
};
