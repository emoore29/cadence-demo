import { Button, Loader } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
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
import Playlist from "./components/playlist";
import Recommendations from "./components/recommendations";
import { TrackObject } from "./types/types";
import { updateSavedStatus } from "./helpers/fetchers";
import { showSuccessNotif } from "./helpers/general";
import { getRecommendations } from "./helpers/playlist";
import { useForm } from "@mantine/form";

function App() {
  const [libSize, setLibSize] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [libraryStored, setLibraryStored] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<Map<string, TrackObject> | null>(
    null
  );
  const [matchingTracks, setMatchingTracks] = useState<Map<
    string,
    TrackObject
  > | null>(null);
  const [recommendations, setRecommendations] = useState<Map<
    string,
    TrackObject
  > | null>(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState<boolean>(false);
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
      source: "1",
      target: 10,
    },
  });
  const [anyTempo, setAnyTempo] = useState<boolean>(false);

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

    // Set user, libSize, lib stored, etc in state if user has already logged in
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

  // Calculates dimensions of circle as duration changes
  function calculateOffset(timeLeft: number): number {
    const circumference = 2 * Math.PI * 18;
    let trackDuration = 29.712653;
    // Calculate percentage of time left, offset dasharray by that amount.
    const strokeDashoffset = (timeLeft / trackDuration) * circumference;
    return strokeDashoffset;
  }

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
        storeMyData={storeMyData}
        libraryStored={libraryStored}
        playlist={playlist}
        setPlaylist={setPlaylist}
        matchingTracks={matchingTracks}
        setMatchingTracks={setMatchingTracks}
        setRecommendations={setRecommendations}
        setLoadingPlaylist={setLoadingPlaylist}
        form={form}
        anyTempo={anyTempo}
        setAnyTempo={setAnyTempo}
      />

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

      <Recommendations
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
    </div>
  );
}

export default App;
