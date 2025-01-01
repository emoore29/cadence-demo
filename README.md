# Cadence Demo

A demo web app that simulates filtering your Spotify library, top tracks, and getting Spotify recommendations based on BPM and other track features. 

Cadence development started on 24 October 2024. On 27 November 2024, [Spotify deprecated the following endpoints overnight](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api) on which Cadence relied:

- Recommendations
- Audio Features
- 30-second preview URLs in multi-get responses
- Get available genre seeds

These are no longer available to existing apps that are still in development mode without a pending extension request, which applies to Cadence.

The original codebase is still theoretically functional, but the access token granted by Cadence's Client ID will not provide access to those endpoints anymore, so fetch requests to Spotify will return 403 or 404 status codes. 

Because of this, demo data is now used for saved tracks, top tracks, and recommendations, to demonstrate how the app would function if the API endpoints were still accessible. Users can still interact with and create playlists with Cadence, but sadly, only with a limited database of tracks purely for demonstration purposes, not with their own Spotify libraries as was intended.

If you are interested in creating playlists based on track features from your actual Spotify data, I recommend [Sort Your Music](http://sortyourmusic.playlistmachinery.com/), which is a web app that was approved pre-deprecation and offers similar functionality and uses the same API endpoints Cadence relied on.

## How it works/worked

Cadence has multiple options for sources to filter tracks from.

A user can choose to load their Spotify saved tracks, top tracks, and top artists. If they do so, their Spotify data are saved in IndexedDB stores as follows:

- "library" - a user's saved tracks
- "topTracks" - a user's top 500 tracks from the last 12 months
- "topArtists" - a user's top 50 artists from the last 12 months

Stored track data is stored alongside a track's features, fetched from the Audio Features Spotify Web API endpoint.

The user can then filter through their saved tracks or top tracks based on track features such as tempo, valence, instrumentalness, and more.

A user also has the option to get recommendations from Spotify based on custom "seeds", such as a user's favourite genre(s), track(s), and/or artist(s). They can also filter these recommendations based on the aforementioned features.

### Access Token

To fetch their Spotify data, create playlists, and update their saved tracks, users need to "log in" and authorize Cadence to access their Spotify data.

The code uses the [Authorization Code Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow), whereby an access token and refresh token is provided to the client.

These tokens are stored in browser local storage, and a refresh request is sent every hour before the current access token expires.

As described above, as of 27 November 2024, an access token obtained in this manner will not provide access to the deprecated endpoints, unless you have a pre-existing client ID and secret from an app that was approved by Spotify before these changes were made.

## How to run locally

Clone the repository with GitHub desktop or via a terminal and open the project root folder in a terminal.

Run the frontend:

```
cd client
npm install
npm run dev
```

Run the backend:

```
cd server
npm install
npm run dev
```

To use the authorization flow described above, create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and save the Client ID and Client Secret in a .env file inside /server:

```
SPOTIFY_CLIENT_ID="<insert ID here>"
SPOTIFY_CLIENT_SECRET="<insert secret here>"
```
