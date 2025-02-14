require("dotenv").config();
const express = require("express");
const cors = require("cors");
var cookieParser = require("cookie-parser");
const port = 3000;
const corsOptions = {
  origin: [
    "https://emoore29.github.io",
    "http://localhost:5173",
    "http://localhost",
  ], // only allow requests from frontend
  credentials: true, // allow cookies
};
const app = express();
const playlistRoute = require("./api/spotify/playlist");
const loginRoute = require("./api/spotify/login");
const callbackRoute = require("./api/spotify/callback");
const refreshTokenRoute = require("./api/spotify/refreshToken");
const guestTokenRoute = require("./api/spotify/guestToken");
const searchDeezerRoute = require("./api/deezer/searchDeezer");
const mbidRoute = require("./api/musicbrainz/mbid");
const featuresRoute = require("./api/acousticbrainz/features");

app.use(cors(corsOptions)).use(cookieParser());

// Routes
app.get("/test", async function (req, res) {
  res.json({ message: "Hello World" });
});

// Spotify
app.use("/spotify", loginRoute);
app.use("/spotify", playlistRoute);
app.use("/spotify", callbackRoute);
app.use("/spotify", refreshTokenRoute);
app.use("/spotify", guestTokenRoute);

// Deezer
app.use("/deezer", searchDeezerRoute);

// MetaBrainz
app.use("/musicbrainz", mbidRoute);
app.use("/acousticbrainz", featuresRoute);

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
