# Cadence Demo

Cadence was originally intended to be accessible for all Spotify users to create customised playlists from their personal Spotify libraries. Unfortunately, in November 2024 towards the end of Cadence's development, [Spotify deprecated the following endpoints without warning](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api), which were needed for Cadence to function as intended:

- Recommendations
- Audio Features
- 30-second preview URLs in multi-get responses
- Get available genre seeds

These are no longer available to existing apps that are still in development mode without a pending extension request, which applies to Cadence. The user access tokens granted by Cadence's Client ID will not provide access to the above endpoints anymore, so fetch requests will return 403 or 404 status codes.

It's difficult to find APIs that offer similar data. [Deezer](https://developers.deezer.com/myapps) has an API that provides track BPM, but currently isn't accepting new developer applications. AcousticBrainz, which offers similar features to Spotify, including track BPM, is unfortunately no longer collecting data as of 2022. Their database of over 7 million unique tracks is [available for download](https://acousticbrainz.org/download).

To finalise the project, I decided to use AcousticBrainz's data to retrieve track audio features. This results in a version of Cadence closest to what was originally intended, albeit with some track audio features unavailable.

If you are interested in creating playlists based on track features from your actual Spotify data, I recommend [Sort Your Music](http://sortyourmusic.playlistmachinery.com/), which is a web app that was approved pre-deprecation and offers similar functionality using the same API endpoints Cadence relied on.

## How it works

Cadence has multiple "sources" of tracks, which users can filter by features such as tempo (BPM).

Once a user has granted Cadence permission to access their Spotify data, they can load their Spotify saved tracks, top tracks, and top artists. When the user's saved and top tracks are fetched, fetches are now made to MusicBrainz and AcousticBrainz to get each track's features and tags (pre-Spotify-deprecation, requests were made to Spotify). Tracks that exist in both the user's Spotify library as well as AcousticBrainz's database can then be stored in IndexedDB stores:

- "savedTracks" - a user's saved tracks and features
- "topTracks" - a user's top 500 tracks and features from the last 12 months
- "topArtists" - a user's top 50 artists from the last 12 months

The user could then choose to filter these stores based on the track features available (currently BPM, chords key and chords scale - pre-Spotify-deprecation, more features were available).

Prior to Spotify deprecation, users also had the option to get recommendations from Spotify based on custom "seeds", such as their favourite genre(s), track(s), and/or artist(s), alongside any desired track features. Now, the input fields to search for these seeds are still functional, but as there is no way to demonstrate this feature with sample data, clicking submit will display an error notification and won't return any tracks.

## Authorization Code Flow

To make any requests to the Spotify API, users need an access token. For this, users need to "log in" and authorize Cadence to access their Spotify data, and this will grant them an access token.

The code uses the [Authorization Code Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow). After the user authorizes Cadence, they are redirected back to the app with access and refresh tokens. These tokens are stored in browser local storage, and a refresh request is sent every hour just before the current access token expires.

Post-deprecation, this is still functional, so users can "log in" to Cadence. This means that when the playlist tracks are displayed, each track's saved status will match the track's saved status in that user's Spotify account and the user can save or unsave a track if they want to. If the user doesn't log in, a warning indicates that the saved statuses may not match their Spotify library and they won't be able to save or unsave any tracks. They also won't be able to save any playlists created with the demo data unless they are logged in.

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
