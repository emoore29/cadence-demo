import { Field } from "@/components/ui/field";
import {
  NumberInputField,
  NumberInputRoot,
} from "@/components/ui/number-input";
import { Radio, RadioGroup } from "@/components/ui/radio";
import {
  getAllFromStore,
  getAllKeysFromStore,
  getFromStore,
  StoreName,
} from "@/helpers/database";
import { getItemFromLocalStorage } from "@/helpers/localStorage";
import { Track, TrackFeatures } from "@/types/types";
import { Button, HStack } from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import Playlist from "./playlist";

export default function Form() {
  const [bpm, setBPM] = useState<[string, string]>(["95", "165"]);
  const [filterFrom, setFilterFrom] = useState("1");
  const [playlist, setPlaylist] = useState<Track[] | null>(null);

  async function filterDatabase(storeName: StoreName) {
    // Get each song's features from the database
    // Check if the features are a match

    let playlist: Track[] = [];

    try {
      const songIds = await getAllKeysFromStore(storeName);
      for (const id of songIds) {
        if (playlist.length >= 20) break;
        const song = (await getFromStore(storeName, id)) as {
          track: Track;
          features: TrackFeatures;
        };
        const songFeatures: TrackFeatures = song.features;
        // For each feature requested in the form, check if the song is a match
        if (
          songFeatures.tempo >= Number(bpm[0]) &&
          songFeatures.tempo <= Number(bpm[1])
        ) {
          playlist.push(song.track);
        }
      }

      // Seed playlist with user's top tracks to get to 20
      if (playlist.length < 20 && storeName == "library") {
        console.log(
          "Playlist generated was too small! Sourcing songs from top tracks..."
        );
        const songIds = await getAllKeysFromStore("topTracks");
        for (const id of songIds) {
          if (playlist.length >= 20) break;
          const song = (await getFromStore("topTracks", id)) as {
            track: Track;
            features: TrackFeatures;
          };
          const songFeatures: TrackFeatures = song.features;
          // For each feature requested in the form, check if the song is a match
          if (
            songFeatures.tempo >= Number(bpm[0]) &&
            songFeatures.tempo <= Number(bpm[1])
          ) {
            playlist.push(song.track);
          }
        }
      }

      if (playlist.length < 20) {
        // Playlist is still too small after sourcing from library and top songs
        // Get recommended songs based on user's top tracks and top artists
        console.log(
          "Playlist generated was too small! Sourcing recommendations from Spotify based on your listening habits."
        );

        // Get top 5 artists
        const topArtists = await getAllFromStore("topArtists");
        const topTracks = await getAllFromStore("topTracks");
        topTracks.sort((a, b) => a.order - b.order);
        console.log("top tracks from idb: ", topTracks);
        const topTrackIds = topTracks.map((track) => track.track.id);
        const topArtistIds = topArtists.map((artist) => artist.id);
        console.log("top 5 track ids:", topTrackIds.slice(0, 5));
        console.log("artist ids:", topArtistIds);

        const accessToken = getItemFromLocalStorage("access_token");
        if (!accessToken) {
          console.error("Access token not found.");
          return null;
        }

        const params = new URLSearchParams({
          seed_artists: topArtistIds.slice(0, 2).join(","),
          seed_tracks: topTrackIds.slice(0, 2).join(","),
          min_tempo: bpm[0],
          max_tempo: bpm[1],
        });

        try {
          const res = await axios.get(
            `https://api.spotify.com/v1/recommendations?${params}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("recommendations:", res.data);
          const recs: Track[] = res.data.tracks;

          for (const rec of recs) {
            if (playlist.length >= 20) break;
            playlist.push(rec);
          }
        } catch (error) {
          console.error("Error fetching top artists:", error);
          return null;
        }

        // Get top 5 tracks
        // Get top 5 genres
      }

      console.log("playlist generated:", playlist);
      setPlaylist(playlist);
    } catch (error) {
      console.error(`Error fetching keys from IDB ${storeName}`, error);
    }
  }

  // advanced filters:
  // valence (mood) slider 0-1
  // danceability 0-1 slider
  // energy: 0-1 (1 = high energy) - slider
  // instrumentalness 0-1 (1 = no vocals) - checkbox? and then if yes, filter 0.5-1, if no, filter 0-0.5?
  // mode (major/minor) - 0 or 1, (0 = minor, 1 = major)
  // time signature: 3-7 (3/4 - 7/4)

  return (
    <>
      <form
        className="playlist-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (filterFrom == "1") {
            filterDatabase("library");
          }
          if (filterFrom == "2") {
            filterDatabase("topTracks");
          }
        }}
      >
        <RadioGroup
          value={filterFrom}
          onValueChange={(e) => setFilterFrom(e.value)}
        >
          <HStack gap="6">
            <Radio value="1">Filter from my library</Radio>
            <Radio value="2">Filter from my top tracks</Radio>
            <Radio value="3">
              Get recommendations based on my listening habits
            </Radio>
          </HStack>
        </RadioGroup>
        <Field label="Min BPM">
          <NumberInputRoot
            value={bpm[0]}
            min={30}
            max={Number(bpm[1])}
            onValueChange={(e) => setBPM((prev) => [e.value, prev[1]])}
            width="200px"
          >
            <NumberInputField />
          </NumberInputRoot>
        </Field>
        <Field label="Max BPM">
          <NumberInputRoot
            value={bpm[1]}
            min={Number(bpm[0])}
            max={300}
            onValueChange={(e) => setBPM((prev) => [prev[0], e.value])}
            width="200px"
          >
            <NumberInputField />
          </NumberInputRoot>
        </Field>
        <Button type="submit">Generate playlist</Button>
      </form>
      {playlist && <Playlist playlist={playlist} />}
    </>
  );
}
