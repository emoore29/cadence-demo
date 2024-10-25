import { useEffect, useState } from "react";
import "./App.css";
import Form from "./components/form";
import Header from "./components/header";
import { checkTokenExpiry } from "./helpers/backend";
import { fetchUserData, loginTokens, storeTokens } from "./helpers/fetchers";
import { User } from "./types/types";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tracks, setTracks] = useState<number>(0);
  const [accessToken, setAccessToken] = useState<string | null>();

  async function setUserData() {
    if (accessToken) {
      const data = await fetchUserData(accessToken);
      setUser(data);
    }
  }

  useEffect(() => {
    const tokens = loginTokens();

    if (tokens) {
      // User has just been redirected from authorizing the app
      const [accessToken, refreshToken, expiresIn] = tokens;
      storeTokens(accessToken, refreshToken, expiresIn);
      window.location.hash = "";
      setUserData();
    } else {
      // Case 2: Tokens and user data are stored in local storage or user has not authorized yet
      checkTokenExpiry();

      const storedUserData = localStorage.getItem("user_data");
      if (storedUserData) {
        setUser(JSON.parse(storedUserData));
      }
      const interval = setInterval(checkTokenExpiry, 3600000); // Check for expiry after 1 hour
      return () => clearInterval(interval);
    }
  }, []);

  // async function loadUsersLibrary() {
  //   const token = localStorage.getItem("access_token");
  //   let library: (Object | null)[] = [];
  //   let nextUrl = "https://api.spotify.com/v1/me/tracks?limit=50";

  //   try {
  //     while (nextUrl) {
  //       const libraryResult = await axios.get(nextUrl, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       library = [...library, ...libraryResult.data.items];
  //       nextUrl = libraryResult.data.next;
  //     }

  //     // Log songs fetched to console to check they're all there.
  //     console.log("Your library was fetched: ", library.length);

  //     // initialise array for storing song features
  //     const featuresLibrary = [];

  //     // Create array of chunks of 100 songs
  //     let n = 0;
  //     const chunks = [];
  //     while (n < library.length) {
  //       chunks.push(library.slice(n, Math.min(n + 100, library.length))); // Stop at the last index of the array if n + 100 > library length
  //       n += 100;
  //     }

  //     // for each chunk, request features for those songs
  //     for (const chunk of chunks) {
  //       // Get all the ids of the songs in the chunk
  //       const songIds = chunk.map((song) => song!.track.id);

  //       // fetch the features of the songs in the chunk
  //       const featuresResult = await axios.get(
  //         "https://api.spotify.com/v1/audio-features",
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //           params: {
  //             ids: songIds.join(","), // Join IDs as a comma-separated string
  //           },
  //         }
  //       );

  //       // add the features to the features library
  //       featuresLibrary.push(featuresResult.data.audio_features);
  //     }
  //     console.log("Song features were fetched:", featuresLibrary);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  return (
    <div className="container">
      <Header user={user} setUser={setUser} />
      {/* <p>
        You have {tracks} saved songs in your library. Loading them all will
        take approximately Y minutes. (Why?)
      </p>
      <p>
        Do you want to load and store your Spotify library? This will make
        generating playlists quicker!
      </p> */}
      {/* <Button onClick={loadUsersLibrary}>Load my library</Button> */}
      {/* Store songs in database?? Get features as well and store in database?? For displaying? */}
      <Form />
    </div>
  );
}

export default App;
