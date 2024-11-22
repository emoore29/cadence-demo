import { Button, Loader } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import Form from "./components/form";
import Header from "./components/header";
import LoadingPlaylist from "./components/loadingPlaylist";
import Playlist from "./components/playlist";
import Recommendations from "./components/recommendations";
import { setUpDatabase } from "./helpers/database";
import { updateSavedStatus } from "./helpers/fetchers";
import { showSuccessNotif } from "./helpers/general";
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
  const [libSize, setLibSize] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [libraryStored, setLibraryStored] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadingDataProgress, setLoadingDataProgress] = useState<number>(0);
  const [playlist, setPlaylist] = useState<Map<string, TrackObject> | null>(
    null
  );
  const [estimatedFetches, setEstimatedFetches] = useState<number>(0);
  const [matchingTracks, setMatchingTracks] = useState<Map<
    string,
    TrackObject
  > | null>(null);
  const [recommendations, setRecommendations] = useState<Map<
    string,
    TrackObject
  > | null>(null);
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
      minTempo: 165,
      maxTempo: 180,
      targetValence: "Any",
      targetDanceability: "Any",
      targetEnergy: "Any",
      targetInstrumentalness: "Any",
      targetAcousticness: "Any",
      source: "2",
      target: 5,
    },
  });
  const [anyTempo, setAnyTempo] = useState<boolean>(false);

  // Sets up IDB on initial page load
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

  // Handles initial page load:
  // Handles initial login, retrieving saved user data from local storage, and sets up access token refresh interval
  useEffect(() => {
    // Store tokens, user data and library size on login
    if (loginOccurred()) {
      handleLogin(setLibSize, setUser, setEstimatedFetches);
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
      console.log("estimated fetches: ", estimatedFetches);
      setEstimatedFetches(estimatedFetches);
      setLibraryStored(wasLibraryStoredInDatabase());
      handleTokens();
    }

    // Handle token expiry every hour
    const interval = setInterval(handleTokens, 3600000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (estimatedFetches !== undefined) {
      console.log("estimatedFetches is updated:", estimatedFetches);
    }
  }, [estimatedFetches]); // This will run after estimatedFetches changes

  function updateProgressBar() {
    console.log(
      `estimatedFetches inside updateProgressBar: ${estimatedFetches}`
    );
    console.log(`Adding ${(1 / estimatedFetches) * 100} to progress bar...`);
    setLoadingDataProgress((prev) => prev + (1 / estimatedFetches) * 100); // + % to progress for each successful request
  }

  // Gets user's Spotify library, top tracks, top artists and stores in IDB
  async function storeMyData(): Promise<void> {
    setLoadingData(true);

    const savedTracks: boolean | null = await storeSavedTracksData(
      updateProgressBar
    );
    const savedTopTracks: boolean | null = await storeTopTracksData(
      updateProgressBar
    );
    const savedTopArtists: boolean | null = await storeTopArtists(
      updateProgressBar
    );

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

  // Updates track's saved status in Spotify & IDB
  // Updates saved indicator accordingly in playlist
  // Adds loading icon while awaiting Spotify API reqs
  async function handleSaveClick(trackObj: TrackObject, saved: boolean) {
    // Add trackId to loading list
    setLoadingSaveStatusTrackIds((prevIds) => [...prevIds, trackObj.track.id]);

    // Update saved status in Spotify & IDB
    const updateStatus: string | null = await updateSavedStatus(
      trackObj,
      saved
    );
    if (!updateStatus) {
      console.log("Failed to update track saved status");
      setLoadingSaveStatusTrackIds((prevIds) =>
        prevIds.filter((id) => id !== trackObj.track.id)
      );
      return;
    }

    // On successful saved status update request, update track saved status in playlist/recommendations
    setPlaylist((prevPlaylist) => {
      const newPlaylist = new Map(prevPlaylist);

      const trackObject = newPlaylist.get(trackObj.track.id);

      if (trackObject) {
        const updatedTrackObject = {
          ...trackObject,
          saved: updateStatus === "Added",
        };
        newPlaylist.set(trackObj.track.id, updatedTrackObject);
      }
      return newPlaylist;
    });

    setRecommendations((prevRecs) => {
      const newRecs = new Map(prevRecs);

      const trackObject = newRecs.get(trackObj.track.id);

      if (trackObject) {
        const updatedTrackObject = {
          ...trackObject,
          saved: updateStatus === "Added",
        };
        newRecs.set(trackObj.track.id, updatedTrackObject);
      }
      return newRecs;
    });

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
      <Header
        setPlaylist={setPlaylist}
        setRecommendations={setRecommendations}
        user={user}
        setUser={setUser}
        setLibSize={setLibSize}
        setLibraryStored={setLibraryStored}
      />
      <div className="main">
        <Form
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
    </div>
  );
}

export default App;
