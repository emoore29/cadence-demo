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

export default function Form() {
  const [bpm, setBPM] = useState<[string, string]>(["95", "165"]);
  const [filterFrom, setFilterFrom] = useState("1");

  // Options:
  // Filter from stored library of user's saved songs
  // Get any recommended from Spotify based on features
  // Filter from stored library of user's top songs (4 weeks, 6m, 12m)
  // Filter from most popular on Spotify
  // Get new recommended songs based on user's top songs (but don't include their songs in the results)
  async function fetchSongs() {
    const token = localStorage.getItem("access_token");
    let songs: (Object | null)[] = [];
    let nextUrl = "https://api.spotify.com/v1/me/tracks?limit=50";

    try {
      while (nextUrl && songs.length < 100) {
        const tracksResult = await axios.get(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        songs = [...songs, ...tracksResult.data.items];
        nextUrl = tracksResult.data.next;
      }

      console.log("Total songs fetched: ", songs.length);
      const songIds = songs.map((song) => song!.track.id);

      const featuresResult = await axios.get(
        "https://api.spotify.com/v1/audio-features",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ids: songIds.join(","), // Join IDs as a comma-separated string
          },
        }
      );
      console.log("Audio Features: ", featuresResult.data.audio_features);

      const songFeatures = featuresResult.data.audio_features;

      // Filter songs based on requested features.
      const playlist = songFeatures.filter(
        (song) => song.tempo >= Number(bpm[0]) && song.tempo <= Number(bpm[1])
      );

      console.log("Playlist:", playlist);
    } catch (error) {
      console.error("Error fetching songs or features", error);
    }
  }

  return (
    <>
      <form
        className="playlist-form"
        onSubmit={(e) => {
          e.preventDefault();
          fetchSongs();
        }}
      >
        <RadioGroup
          value={filterFrom}
          onValueChange={(e) => setFilterFrom(e.value)}
        >
          <HStack gap="6">
            <Radio value="1">Filter from my top songs</Radio>
            <Radio value="2">Filter from my saved songs</Radio>
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
    </>
  );
}
