import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import "./App.css";
import Form from "./components/form";
import Header from "./components/header";
import { handleTokens } from "./helpers/backend";
import {
  getLibSizeFromLocalStorage,
  getTopArtists,
  getTopTracks,
  getUserFromLocalStorage,
  handleLogin,
  loginOccurred,
  setUpDatabase,
} from "./helpers/frontend";
import { User } from "./types/types";

function App() {
  const [libSize, setLibSize] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const setupDb = async () => {
      try {
        setUpDatabase(); // setUpDatabase will only create a new db if it doesn't already exist.
      } catch (error) {
        console.error("Failed to setup database:", error);
      }
    };
    setupDb();
  }, []);

  useEffect(() => {
    // If user just logged in
    if (loginOccurred()) {
      handleLogin(setLibSize, setUser); // update tokens, user data, and lib size
    }

    // If user is already logged in
    const user = getUserFromLocalStorage();
    if (user) {
      setUser(user);
      setLibSize(getLibSizeFromLocalStorage());
      handleTokens();
    }

    // Handle token expiry every hour
    const interval = setInterval(handleTokens, 3600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <Header user={user} setUser={setUser} setLibSize={setLibSize} />
      {libSize && (
        <p>
          You have {libSize} saved songs in your library. Loading them all will
          take approximately Y minutes. (Why?)
        </p>
      )}
      <Button onClick={getTopArtists}>getTopArtists</Button>
      <Button onClick={getTopTracks}>getTopTracks</Button>
      {/* 
      <p>
        Do you want to load and store your Spotify library? This will make
        generating playlists quicker!
      </p> */}
      {/* <Button onClick={loadUsersLibrary}>Load my library</Button> */}
      <Form />
    </div>
  );
}

export default App;
