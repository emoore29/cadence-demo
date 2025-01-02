import { useForm } from "@mantine/form";

import { useEffect, useRef, useState } from "react";
import "./App.css";
import Form from "./components/form";
import Header from "./components/header";
import LoadingPlaylist from "./components/loadingPlaylist";
import Playlist from "./components/playlist";
import Recommendations from "./components/recommendations";
import { getAllFromStore, setUpDatabase, StoreName } from "./helpers/database";
import { updateSavedStatus } from "./helpers/fetchers";
import { showErrorNotif, showSuccessNotif } from "./helpers/general";
import {
  storeDemoLibrary,
  storeDemoRecommendations,
  storeDemoTopTracks,
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
import Welcome from "./components/welcome";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

function App() {
  const [libSize, setLibSize] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [libraryStored, setLibraryStored] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadingDataProgress, setLoadingDataProgress] = useState<number>(0);
  const [playlist, setPlaylist] = useState<Map<string, TrackObject>>(new Map());
  const [estimatedFetches, setEstimatedFetches] = useState<number>(0);
  const [matchingTracks, setMatchingTracks] = useState<
    Map<string, TrackObject>
  >(new Map());
  const [recommendations, setRecommendations] = useState<
    Map<string, TrackObject>
  >(new Map());
  const [loadingPlaylist, setLoadingPlaylist] = useState<boolean>(false);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [loadingSaveStatusTrackIds, setLoadingSaveStatusTrackIds] = useState<
    string[]
  >([]);
  const [playingTrackId, setPlayingTrackId] = useState<string>(""); // Id of current track being previewed
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const [circleOffsets, setCircleOffsets] = useState<Record<string, number>>(
    {}
  ); // Stores time left on each track in playlist
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      minTempo: 120,
      maxTempo: 135,
      targetValence: "Any",
      targetDanceability: "Any",
      targetEnergy: "Any",
      targetInstrumentalness: "Any",
      targetAcousticness: "Any",
      source: "1",
      target: 5,
    },
  });
  const [anyTempo, setAnyTempo] = useState<boolean>(false);
  const [activeSourceTab, setActiveSourceTab] = useState<string | null>(
    "custom"
  );
  const [welcome, setWelcome] = useState<boolean>(true);
  const icon = <IconInfoCircle />;

  // Values needed to calculate load bar for loading demo data
  const demoLibSize = 455;
  const demoRecsSize = 798;
  const demoTopTracks = 50;
  const topArtistsFetch = 1;
  const totalLoadActions =
    demoLibSize + demoRecsSize + demoTopTracks + topArtistsFetch;

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
        handleLogin(setLibSize, setUser, setEstimatedFetches);
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
        libSize && setLibSize(libSize);

        const estimatedFetches = (3 * libSize) / 100 + 16;
        setEstimatedFetches(estimatedFetches);
        setLibraryStored(wasLibraryStoredInDatabase());
        await handleTokens();
        // localStorage.setItem(
        //   "access_token",
        //   "BQB-ryf74dxIUn_7W2aCKbRaGDzllZ6wDBr_Da-1_6emM7g3Ff4-oenlRs03n9N5YXuQwKwEB1lXDuNch8-3DtJo3MbaUTMOD-u3byvsioRLAE1YK6tPS159J1vYnQT-_pOsg2TGAi69bhng2VHEXq_PLueO2Yu5qJd0ai8Lj_EpH1NxsVD2KHbL4dcIOG88fJ1SHR46gpwAeH9ZdVhEIL8Wip1SoolYOOhZnOCiXPFM-Vjc7xQOmooRGV_1zoShLG2ZK0GJw_r9kJbJLRI74Y6cZ1a-cIg4pViqAAloqsul9K_dhhxPMZrUPIxQNO4bsaUn5LDrEG0"
        // );
      }

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
    setLoadingDataProgress((prev) => prev + (1 / totalLoadActions) * 100);
  }

  // Gets user's Spotify library, top tracks, top artists and stores in IDB
  async function storeMyData(): Promise<void> {
    setLoadingData(true);

    // ↓ Code to retrieve actual Spotify data pre-deprecation ↓
    // const savedTracks: boolean | null = await storeSavedTracksData(
    //   updateProgressBar
    // );
    // const savedTopTracks: boolean | null = await storeTopTracksData(
    //   updateProgressBar
    // );
    // const savedTopArtists: boolean | null = await storeTopArtists(
    //   updateProgressBar
    // );

    // ↓ Code for demo version post-deprecation ↓

    const savedTracks: boolean | null = await storeDemoLibrary(
      updateProgressBar
    );
    if (!savedTracks) {
      errorStoringData();
      return;
    }
    const savedTopTracks: boolean | null = await storeDemoTopTracks(
      updateProgressBar
    );
    if (!savedTopTracks) {
      errorStoringData();
      return;
    }
    const recommendations: boolean | null = await storeDemoRecommendations(
      updateProgressBar
    );
    if (!recommendations) {
      errorStoringData();
      return;
    }

    setLoadingData(false);
    storeDataInLocalStorage("library_was_stored", true);
    setLibraryStored(true);
    setLoadingDataProgress(0);
  }

  function errorStoringData() {
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
  async function handleSaveClick(
    list: string,
    trackObj: TrackObject,
    saved: boolean
  ) {
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
    // update track saved status in playlist/recommendations
    if (list === "Playlist") {
      setPlaylist((prev) =>
        updateTrackSavedStatus(prev, trackObj, updateStatus)
      );
    } else if (list === "Recommendations") {
      setRecommendations((prev) =>
        updateTrackSavedStatus(prev, trackObj, updateStatus)
      );
    }

    setLoadingSaveStatusTrackIds((prevIds) =>
      prevIds.filter((id) => id !== trackObj.track.id)
    ); // Filter for all but the current track id

    // Once saved status has been updated, display toast that indicates success
    saved
      ? showSuccessNotif("", "Removed from Liked Songs")
      : showSuccessNotif("", "Added to Liked Songs");
  }

  // Calculates dimensions of track preview circle as duration changes
  function calculateOffset(timeLeft: number): number {
    const circumference = 2 * Math.PI * 18;
    let trackDuration = 29.712653;
    // Calculate percentage of time left, offset dasharray by that amount.
    const strokeDashoffset = (timeLeft / trackDuration) * circumference;
    return strokeDashoffset;
  }

  // Handles user click on play preview button
  function playTrackPreview(trackId: string) {
    const audioElement = audioRefs.current[trackId];

    if (!audioElement) return; // Early return if no audio element found
    audioElement.volume = 0.3; // Set vol

    // Attach timeupdate event to update circle preview (if one doesn't already exist)
    if (!audioElement.ontimeupdate) {
      audioElement.ontimeupdate = () => {
        // Calculate remaining time in track audio preview
        const remaining = audioElement.duration - audioElement.currentTime;
        const offset = calculateOffset(remaining);

        // Calculate offset from `remaining` and add to circleOffsets
        setCircleOffsets((prev) => ({
          ...prev,
          [trackId]: offset,
        }));
      };
    }

    // Attach onended event handler to reset play/pause when track ends
    if (!audioElement.onended) {
      audioElement.onended = () => {
        setPlayingTrackId(""); // remove track id from "playing track" state to reset play btn
      };
    }

    // Handle pause/play of tracks
    if (audioElement.paused) {
      // Pause any other track that is playing
      if (playingTrackId && playingTrackId !== trackId) {
        audioRefs.current[playingTrackId]?.pause();
      }

      // Recalculate offset for new track being played
      setCircleOffsets((prev) => ({
        ...prev,
        [trackId]: calculateOffset(
          audioElement.duration - audioElement.currentTime
        ),
      }));
      setPlayingTrackId(trackId);
      audioElement.play();
    } else {
      setPlayingTrackId("");
      audioElement.pause();
    }
  }

  return (
    <div className="container">
      <>
        <Header
          setPlaylist={setPlaylist}
          setRecommendations={setRecommendations}
          user={user}
          setUser={setUser}
          setLibSize={setLibSize}
          setLibraryStored={setLibraryStored}
        />
        <Alert
          variant="light"
          color="grape"
          title="Spotify API deprecation"
          icon={icon}
          style={{ marginBottom: "20px" }}
        >
          Spotify has deprecated the endpoints Cadence required to function.
          This app now uses a small set of sample track data for demonstration
          purposes only. Read more{" "}
          <a href="https://github.com/emoore29/cadence-demo">here</a>.
        </Alert>
        <div className="main">
          <Form
            activeSourceTab={activeSourceTab}
            setActiveSourceTab={setActiveSourceTab}
            loadingData={loadingData}
            loadingDataProgress={loadingDataProgress}
            storeMyData={storeMyData}
            libraryStored={libraryStored}
            playlist={playlist}
            setPlaylist={setPlaylist}
            matchingTracks={matchingTracks}
            setMatchingTracks={setMatchingTracks}
            setRecommendations={setRecommendations}
            setLoadingPlaylist={setLoadingPlaylist}
            setLoadingRecs={setLoadingRecs}
            form={form}
            anyTempo={anyTempo}
            setAnyTempo={setAnyTempo}
          />
          <div className="playlistAndRecsContainer">
            <h2>Results</h2>
            {loadingPlaylist ? (
              <LoadingPlaylist targetTracks={5} />
            ) : (
              <Playlist
                setMatchingTracks={setMatchingTracks}
                matchingTracks={matchingTracks}
                playlist={playlist}
                setPlaylist={setPlaylist}
                handleSaveClick={handleSaveClick}
                loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
                playTrackPreview={playTrackPreview}
                playingTrackId={playingTrackId}
                audioRefs={audioRefs}
                circleOffsets={circleOffsets}
              />
            )}
            {loadingRecs ? (
              <>
                <h2>Suggestions</h2>
                <LoadingPlaylist targetTracks={3} />
              </>
            ) : (
              <Recommendations
                setLoadingRecs={setLoadingRecs}
                playlist={playlist}
                setPlaylist={setPlaylist}
                recommendations={recommendations}
                setRecommendations={setRecommendations}
                handleSaveClick={handleSaveClick}
                loadingSaveStatusTrackIds={loadingSaveStatusTrackIds}
                playTrackPreview={playTrackPreview}
                playingTrackId={playingTrackId}
                audioRefs={audioRefs}
                circleOffsets={circleOffsets}
                form={form}
                anyTempo={anyTempo}
              />
            )}
          </div>
        </div>
      </>
    </div>
  );
}

export default App;
