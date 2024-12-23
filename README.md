# Cadence (Demo*)

A web app that lets you filter your Spotify library, top tracks, and get recommendations based on BPM and more.

## NOTE: *API Deprecation

Cadence development started on 24 October 2024. On 27 November 2024, [Spotify deprecated the following endpoints overnight](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api) on which Cadence relies:

- Recommendations
- Audio Features
- 30-second preview URLs in multi-get responses

These are no longer available to existing apps that are still in development mode without a pending extension request, which applies to Cadence. 

The current codebase still works, but the access token granted will not give access to those endpoints anymore.

I plan on creating a demo with some data I saved during the development process for testing.

## How it works/worked

Cadence has multiple options for "pools" to filter tracks from.

A user can choose to load their Spotify saved tracks, top tracks, and top artists. If they do so, the data are saved in IndexedDB stores: 

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

As of 27 November 2024, an access token obtained in this manner will not provide access to the deprecated endpoints decribed above, unless you have a pre-existing client ID and secret from an app that was approved by Spotify before these changes were made.

## How to run

Clone the repository with GitHub desktop or via a terminal.

`cd client`
`npm install`
`npm run dev`

`cd server`
`npm install`
`npm run dev`

To use the authorization flow described above, create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and save the Client ID and Client Secret in a .env file inside /server:

`SPOTIFY_CLIENT_ID="<insert ID here>"
SPOTIFY_CLIENT_SECRET="<insert secret here>"`



