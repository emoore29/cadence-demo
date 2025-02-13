require("dotenv").config();
const express = require("express");
const cors = require("cors");
var cookieParser = require("cookie-parser");
const port = 3000;
const corsOptions = {
  origin: ["https://emoore29.github.io", "http://localhost:5173"],
  credentials: true, // allow cookies
};
const pg = require("pg"); // Node.js modules to interface with Postgres
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

// Connect to Postgres Database
const { Client } = pg;
const client = new Client({
  user: "musicbrainz",
  password: "musicbrainz",
  host: "172.19.0.4",
  port: 5432,
  database: "musicbrainz_db",
});

async function connectToDb() {
  try {
    await client.connect();
  } catch (error) {
    const now = new Date();
    const currentTime = now.toLocaleString();
    console.log(`${currentTime}: Failed to connect to database`);
  }
}

connectToDb();

app.get("/test", async function (req, res) {
  res.json({ message: "Hello World" });
});

// Spotify
app.use("/api/spotify", loginRoute);
app.use("/api/spotify", playlistRoute);
app.use("/api/spotify", callbackRoute);
app.use("/api/spotify", refreshTokenRoute);
app.use("/api/spotify", guestTokenRoute);

// Deezer
app.use("/api/deezer", searchDeezerRoute);

// MetaBrainz
app.use("/api/musicbrainz", mbidRoute);
app.use("/api/acousticbrainz", featuresRoute);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = client;
