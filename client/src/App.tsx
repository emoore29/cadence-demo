import { Button, Loader } from "@mantine/core";
import { useEffect, useState } from "react";
import "./App.css";
import Form from "./components/form";
import Header from "./components/header";
import { setUpDatabase } from "./helpers/database";
import {
  storeSavedTracksData,
  storeTopArtists,
  storeTopTracksData,
} from "./helpers/indexedDbHelpers";
import {
  getItemFromLocalStorage,
  storeDataInLocalStorage,
  wasLibraryStoredInDatabase,
} from "./helpers/localStorage";
import { handleLogin, loginOccurred } from "./helpers/login";
import { handleTokens } from "./helpers/tokens";
import { User } from "./types/types";

function App() {
  const [libSize, setLibSize] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [libraryStored, setLibraryStored] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);

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
    // Store tokens, user data and library size on login
    if (loginOccurred()) {
      handleLogin(setLibSize, setUser);
    }

    // Set data in state if user has already logged in
    // Check for token expiry with handleTokens()
    const user: string | null = getItemFromLocalStorage("user_data");
    if (user) {
      setUser(JSON.parse(user));
      const libSize: number | null = Number(
        getItemFromLocalStorage("lib_size")
      );
      libSize && setLibSize(libSize);
      setLibraryStored(wasLibraryStoredInDatabase());
      handleTokens();
    }

    // Handle token expiry every hour
    const interval = setInterval(handleTokens, 3600000);
    return () => clearInterval(interval);
  }, []);

  async function storeMyData(): Promise<void> {
    setLoadingData(true);

    const savedTracks: boolean | null = await storeSavedTracksData();
    const savedTopTracks: boolean | null = await storeTopTracksData();
    const savedTopArtists: boolean | null = await storeTopArtists();

    if (savedTracks && savedTopTracks && savedTopArtists) {
      setLoadingData(false);
      storeDataInLocalStorage("library_was_stored", true);
      setLibraryStored(true);
    } else {
      setLoadingData(false);
      setLibraryStored(false);
      console.log("Sorry, there was an error attempting to store your data.");
    }
  }

  return (
    <div className="container">
      <Header
        user={user}
        setUser={setUser}
        setLibSize={setLibSize}
        setLibraryStored={setLibraryStored}
      />
      {user && !libraryStored && (
        <>
          <p>
            To use your Spotify data to create playlists, you can store your
            data. You have {libSize} saved tracks. This may take a minute...
          </p>
          {!loadingData ? (
            <Button onClick={storeMyData}>
              Store my Spotify data in the database!
            </Button>
          ) : (
            <Loader color="white" type="dots" />
          )}
        </>
      )}
      <Form
        user={user}
        storeMyData={storeMyData}
        libraryStored={libraryStored}
      />
    </div>
  );
}

export default App;
