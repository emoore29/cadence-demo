import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import "./App.css";
import Form from "./components/form";
import Header from "./components/header";
import { handleTokens } from "./helpers/backend";
import { setUpDatabase } from "./helpers/database";
import {
  fetchAndStoreLibraryData,
  getLibSizeFromLocalStorage,
  getUserFromLocalStorage,
  handleLogin,
  isLibraryStoredInDB,
  loginOccurred,
} from "./helpers/frontend";
import { User } from "./types/types";

function App() {
  const [libSize, setLibSize] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [libraryStored, setLibraryStored] = useState<boolean>(false);

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
      console.log("handle tokens running next...");
      handleTokens();
      setLibraryStored(isLibraryStoredInDB());
    }

    // Handle token expiry every hour
    const interval = setInterval(handleTokens, 3600000);
    return () => clearInterval(interval);
  }, []);

  async function storeLibrary(): Promise<void> {
    const success: boolean | null = await fetchAndStoreLibraryData();
    if (success) {
      localStorage.setItem("library_was_stored", success.toString());
      setLibraryStored(isLibraryStoredInDB());
    }
  }

  return (
    <div className="container">
      <Header user={user} setUser={setUser} setLibSize={setLibSize} />
      {!libraryStored && (
        <>
          <p>
            Welcome to Cadence! You have {libSize} saved songs in your library.
            Loading them all will take approximately Y minutes. (Why?)
          </p>

          <Button onClick={storeLibrary}>
            Store my library in the database!
          </Button>
        </>
      )}

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
