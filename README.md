# Cadence (In Development)

A web app that lets you filter your Spotify library, top tracks, and get recommendations.

## How it works

Cadence has multiple options for "pools" to filter tracks from.

A user can choose to load their Spotify saved tracks, top tracks, and top artists. If they do so, the data are saved in IndexedDB stores: 

- "library" - a user's saved tracks
- "topTracks" - a user's top 500 tracks from the last 12 months
- "topArtists" - a user's top 50 artists from the last 12 months

Stored track data is stored alongside a track's features, fetched from the Audio Features Spotify Web API endpoint.

The user can then filter through their saved tracks or top tracks based on track features such as tempo, valence, instrumentalness, and more.

A user also has the option to get recommendations from Spotify based on custom "seeds", such as a user's favourite genre(s), track(s), and/or artist(s). They can also filter these recommendations based on the aforementioned features.

## Original Access Token (now deprecated - see API deprecation)

To fetch their Spotify data, create playlists, and update their saved tracks, users need to "log in" and authorize Cadence to access their Spotify data. 

This uses the [Authorization Code Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow) whereby an access token and refresh token is provided to the client.

These tokens are stored in browser local storage, and a refresh request is sent every hour before the current access token expires.


## API Deprecation

Cadence development started on 24 October 2024. On 27 November 2024, Spotify deprecated the following endpoints on which Cadence relies:

- Recommendations
- Audio Features
- 30-second preview URLs in multi-get responses

These are no longer available to existing apps that are still in development mode without a pending extension request, which applies to Cadence.


## Development Updates

Due to the API endpoint deprecation, Cadence can no longer function as originally intended.

Currently, a workaround allows users to [obtain an access token manually](https://open.spotify.com/get_access_token), which, as of 30 November 2024, still provides access to the deprecated endpoints.

While this works, uses can input their manually obtained access token and use Cadence as originally intended, with the original authorization flow being redundant.

Since this workaround isn't a guaranteed long-term solution, the current development plan is to focus on creating a demo with mock data for the final project.

## How to run

Clone the repository with GitHub desktop or via a terminal.

`cd client`
`npm install`
`npm run dev`

`cd server`
`npm install`
`npm run dev`






