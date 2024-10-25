import { Field } from "@/components/ui/field";
import { HStack } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Button } from "@chakra-ui/react";
import {
  NumberInputField,
  NumberInputRoot,
} from "@/components/ui/number-input";
import { useState } from "react";
import axios from "axios";
import Playlist from "./playlist";

export default function Form() {
  const [bpm, setBPM] = useState<[string, string]>(["95", "165"]);
  const [filterFrom, setFilterFrom] = useState("1");
  const [playlist, setPlaylist] = useState<Object>();

  // Options:
  // Filter from stored library of user's saved songs
  // Get any recommended from Spotify based on features
  // Filter from stored library of user's top songs (4 weeks, 6m, 12m)
  // Filter from most popular on Spotify
  // Get new recommended songs based on user's top songs (but don't include their songs in the results)
  async function fetchFromTopSongs() {
    const token = localStorage.getItem("access_token");
    // Library for storing fetched songs that will be filtered
    let library: (Object | null)[] = [];
    let nextUrl = "https://api.spotify.com/v1/me/top/tracks?limit=50";

    try {
      while (nextUrl && library.length < 100) {
        const result = await axios.get(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(result);
        library = [...library, ...result.data.items];
        nextUrl = result.data.next;
      }

      console.log("song 1: ", library[0]);

      // Get the ids of songs in the library
      const songIds = library.map((song) => song!.id);

      // Get the features of the songs from the library
      const libraryFeaturesResult = await axios.get(
        "https://api.spotify.com/v1/audio-features",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ids: songIds.join(","),
          },
        }
      );

      // Array of the library songs features
      const libraryFeatures = libraryFeaturesResult.data.audio_features;

      // Filter feature array of songs for songs that match the form preferences
      const matchingSongs = libraryFeatures.filter(
        (song) => song.tempo >= Number(bpm[0]) && song.tempo <= Number(bpm[1])
      );

      // Create a set of matching song IDs for quick lookup
      const matchingSongIds = new Set(matchingSongs.map((song) => song.id));

      // Filter library for songs that match the ids of the matchingSongs array
      const playlist = library.filter((song) => matchingSongIds.has(song.id));

      if (playlist.length > 20) {
        // Slice the first 20 songs from the shuffled playlist
        setPlaylist(playlist.slice(0, 20));
      } else {
        setPlaylist(playlist);
      }

      console.log("Playlist:", playlist);
    } catch (error) {
      console.error("Error fetching songs or features", error);
    }
  }

  async function fetchFromLatestLibrary() {}

  return (
    <>
      <form
        className="playlist-form"
        onSubmit={(e) => {
          e.preventDefault();
          fetchFromTopSongs();
        }}
      >
        <RadioGroup
          value={filterFrom}
          onValueChange={(e) => setFilterFrom(e.value)}
        >
          <HStack gap="6">
            <Radio value="1">Filter from my top songs</Radio>
            <Radio value="2">Filter from my latest saved songs</Radio>
            <Radio value="3">Filter from most popular on Spotify</Radio>
            <Radio value="3">Give me new recommendations</Radio>
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
      <Playlist playlist={playlist} />
    </>
  );
}
