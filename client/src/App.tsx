import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Footer from "./components/Footer/footer";
import Form from "./components/Form/form";
import Header from "./components/Header/header";
import LoadingPlaylist from "./components/LoadingPlaylist/loadingPlaylist";
import PlaybackProvider from "./components/PlaybackProvider/PlaybackProvider";
import Playlist from "./components/Playlist/playlist";
import Welcome from "./components/Welcome/welcome";
import { setUpDatabase } from "./helpers/database";
import { updateSavedStatus } from "./helpers/fetchers";
import {
  msToPlaylistTime,
  showErrorNotif,
  showSuccessNotif,
} from "./helpers/general";
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
import { TrackObject, User } from "./types/types";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [libraryStored, setLibraryStored] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadingDataProgress, setLoadingDataProgress] = useState<number>(0);
  const [playlist, setPlaylist] = useState<Map<string, TrackObject>>(new Map());
  const [estimatedActions, setEstimatedActions] = useState<number>(0);
  const [estimatedLoadTime, setEstimatedLoadTime] = useState<string>(
    "Log in to get an estimated load time"
  );
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [matchingTracks, setMatchingTracks] = useState<
    Map<string, TrackObject>
  >(new Map());

  const [loadingPlaylist, setLoadingPlaylist] = useState<boolean>(false);
  const [loadingSaveStatusTrackIds, setLoadingSaveStatusTrackIds] = useState<
    string[]
  >([]);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      minTempo: 80,
      maxTempo: 90,
      key: "Any",
      mode: "Any",
      danceability: "Any",
      gender: "Any",
      acoustic: "Any",
      aggressive: "Any",
      electronic: "Any",
      happy: "Any",
      party: "Any",
      relaxed: "Any",
      sad: "Any",
      timbre: "Any",
      source: "1",
      target: 8,
    },
  });

  const [anyTempo, setAnyTempo] = useState<boolean>(false);
  const [halfTime, setHalfTime] = useState<boolean>(false);
  const [doubleTime, setDoubleTime] = useState<boolean>(false);
  const [activeSourceTab, setActiveSourceTab] = useState<string | null>(
    "mySpotify"
  );

  // Sets up IDB on initial page load if it doesn't already exist
  useEffect(() => {
    const setupDb = async () => {
      try {
        setUpDatabase();
      } catch (error) {
        console.error("Failed to setup database:", error);
      }
    };
    setupDb();
  }, []);

  // On initial page load or refresh:
  // Handles initial login
  // If user is already logged in, retrieves saved user data from local storage,
  // and restarts access token refresh interval
  useEffect(() => {
    async function initialize() {
      // Store tokens, user data and library size on login
      if (loginOccurred()) {
        handleLogin(setUser, setEstimatedActions);
        setLibraryStored(wasLibraryStoredInDatabase());
      }

      // Set user, libSize, lib stored, etc in state if user has already logged in
      // Check for token expiry with handleTokens()
      const user: string | null = getItemFromLocalStorage("user_data");
      if (user) {
        setUser(JSON.parse(user));
        const libSize: number | null = Number(
          getItemFromLocalStorage("lib_size")
        );

        // Calculate estimated number actions based on user's library size
        const estimatedActions = (51 * libSize + 1050) / 50;
        setEstimatedActions(estimatedActions);

        // Calculate estimated time to load data
        const estimatedLoadTime: string = msToPlaylistTime(
          (libSize + 500) * 1000
        );
        setEstimatedLoadTime(estimatedLoadTime);

        setLibraryStored(wasLibraryStoredInDatabase());
        await handleTokens();
      }

      setLibraryStored(wasLibraryStoredInDatabase());

      // Handle token expiry every hour
      const interval = setInterval(handleTokens, 3600000);
      return () => {
        clearInterval(interval);
      };
    }

    initialize();
  }, []);

  // Adds % to progress bar for every successful fetch of new track data
  function updateProgressBar() {
    setLoadingDataProgress((prev) => prev + (1 / estimatedActions) * 100);
  }

  // ↓ Pre-deprecation to retrieve actual Spotify data (track features reqs will return 400 errors) ↓
  async function storeSpotifyData(): Promise<void> {
    const start: number = Date.now();
    setLoadingData(true);

    // Fetch and store saved track data
    const savedTracks: number | null = await storeSavedTracksData(
      updateProgressBar
    );
    if (!savedTracks || savedTracks == 0) {
      errorStoringData();
      return;
    }

    // Fetch and store top track data
    const topTracks: number | null = await storeTopTracksData(
      updateProgressBar
    );
    if (!topTracks || topTracks == 0) {
      errorStoringData();
      return;
    }

    // Fetch and store top artists
    const savedTopArtists: boolean | null = await storeTopArtists(
      updateProgressBar
    );
    if (!savedTopArtists) {
      errorStoringData();
      return;
    }

    setLoadingData(false);
    storeDataInLocalStorage("library_was_stored", true);
    setLibraryStored(true);
    setLoadingDataProgress(0);
    const ms = Date.now() - start;
    console.log(`Time in seconds to load data: ${Math.floor(ms / 1000)} `);
  }

  function errorStoringData(): void {
    setLoadingData(false);
    setLibraryStored(false);
    setLoadingDataProgress(0);
    showErrorNotif("Error", "Something went wrong while loading demo data.");
  }

  // Updates a track's saved status in state
  // (passed to setPlaylist or setRecommendations)
  function updateTrackSavedStatus(
    prevList: Map<string, TrackObject>,
    trackObj: TrackObject,
    updateStatus: string
  ): Map<string, TrackObject> {
    const newList = new Map(prevList);

    const trackObject = newList.get(trackObj.track.id);

    if (trackObject) {
      const updatedTrackObject = {
        ...trackObject,
        saved: updateStatus === "Added",
      };
      newList.set(trackObj.track.id, updatedTrackObject);
    }
    return newList;
  }

  // Updates saved status in Spotify and IDB
  // Adds loading icon while awaiting Spotify API reqs
  async function handleSaveClick(trackObj: TrackObject, saved: boolean) {
    // Add trackId to loading list
    setLoadingSaveStatusTrackIds((prevIds) => [...prevIds, trackObj.track.id]);

    // Update saved status in Spotify & IDB
    // updateSavedStatus shows error notif if it fails
    const updateStatus: string | null = await updateSavedStatus(
      trackObj,
      saved
    );

    // If it fails, remove loading status with no change to saved status
    if (!updateStatus) {
      setLoadingSaveStatusTrackIds((prevIds) =>
        prevIds.filter((id) => id !== trackObj.track.id)
      );
      return;
    }

    // On successful saved status update request,
    // update track saved status in playlist
    setPlaylist((prev) => updateTrackSavedStatus(prev, trackObj, updateStatus));

    setLoadingSaveStatusTrackIds((prevIds) =>
      prevIds.filter((id) => id !== trackObj.track.id)
    ); // Filter for all but the current track id

    // Once saved status has been updated, display toast that indicates success
    saved
      ? showSuccessNotif("", "Removed from Liked Songs")
      : showSuccessNotif("", "Added to Liked Songs");
  }

  return (
    <div className={styles.container}>
      <Header
        setPlaylist={setPlaylist}
        user={user}
        setUser={setUser}
        setLibraryStored={setLibraryStored}
      />
      <div className={styles.main}>
        <Form
          estimatedLoadTime={estimatedLoadTime}
          setHasSearched={setHasSearched}
          activeSourceTab={activeSourceTab}
          setActiveSourceTab={setActiveSourceTab}
          loadingData={loadingData}
          loadingDataProgress={loadingDataProgress}
          storeSpotifyData={storeSpotifyData}
          libraryStored={libraryStored}
          playlist={playlist}
          setPlaylist={setPlaylist}
          matchingTracks={matchingTracks}
          setMatchingTracks={setMatchingTracks}
          setLoadingPlaylist={setLoadingPlaylist}
          form={form}
          anyTempo={anyTempo}
          halfTime={halfTime}
          doubleTime={doubleTime}
          setAnyTempo={setAnyTempo}
          setHalfTime={setHalfTime}
          setDoubleTime={setDoubleTime}
        />
        {hasSearched ? (
          <div className={styles.playlistAndRecsContainer}>
            <h2>Results</h2>
            {loadingPlaylist ? (
              <LoadingPlaylist targetTracks={5} />
            ) : (
              <PlaybackProvider>
                <Playlist
                  playlist={playlist}
                  matchingTracks={matchingTracks}
                  setPlaylist={setPlaylist}
                  setMatchingTracks={setMatchingTracks}
                  handleSaveClick={handleSaveClick}
                  loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
                />
              </PlaybackProvider>
            )}
          </div>
        ) : (
          <Welcome />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
