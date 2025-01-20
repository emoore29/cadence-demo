# Cadence Demo

Cadence was originally intended to be accessible for all Spotify users to create customised playlists from their personal Spotify libraries. Unfortunately, in November 2024 towards the end of Cadence's development, [Spotify deprecated the following endpoints without warning](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api), which were needed for Cadence to function as intended:

- Recommendations
- Audio Features
- 30-second preview URLs in multi-get responses
- Get available genre seeds

These are no longer available to existing apps that are still in development mode without a pending extension request, which applies to Cadence. It's difficult to find APIs that offer similar data. [Deezer](https://developers.deezer.com/myapps) has an API that provides track BPM, but currently isn't accepting new developer applications. AcousticBrainz, which offers similar features to Spotify, including track BPM, is unfortunately no longer collecting data as of 2022. Their database of over 7 million unique tracks is [available for download](https://acousticbrainz.org/download).

I started Cadence to practice working with APIs, and I knew I would use its features to create my own running playlists. It's disappointing to not be able to complete a fully-functioning app, but I think I've learned as much as I can from this project, and it's time to move on to something new. Therefore, in the interests of finalising the project, I've created a demo using a small set of sample track data.

The original codebase is all still there and is theoretically functional, but the user access tokens granted by Cadence's Client ID will not provide access to the above endpoints anymore, so fetch requests will return 403 or 404 status codes.

Where possible, demo data is used to demonstrate how the app would function if the API endpoints were still accessible. Users can still interact with and create playlists with Cadence, but sadly, only with a limited amount of tracks for demonstration purposes.

If you are interested in creating playlists based on track features from your actual Spotify data, I recommend [Sort Your Music](http://sortyourmusic.playlistmachinery.com/), which is a web app that was approved pre-deprecation and offers similar functionality using the same API endpoints Cadence relied on.

## How it worked

Cadence has multiple "sources" of tracks, which users can filter by features such as tempo (BPM).

Pre-deprecation, a user could choose to load their Spotify saved tracks, top tracks, and top artists. When the user's saved and top tracks were fetched, fetches would also be made to get each track's features. Then, the fetched data would be saved in IndexedDB stores as follows:

- "library" - a user's saved tracks (and features)
- "topTracks" - a user's top 500 tracks (and features) from the last 12 months
- "topArtists" - a user's top 50 artists from the last 12 months

The user could then choose to filter through their saved tracks or top tracks based on track features such as tempo, valence, instrumentalness, and more.

This has now been replaced with a button to "load demo data", which loads a set of sample tracks and their features into IndexedDB which is now the only "source" users can filter. Users don't need to be logged in to load the demo data.

Users also had the option to get recommendations from Spotify based on custom "seeds", such as their favourite genre(s), track(s), and/or artist(s), alongside any desired track features. Now, the input fields to search for these seeds are still functional, but as there is no way to demonstrate this feature with sample data, clicking submit will display an error notification and won't return any tracks.

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
