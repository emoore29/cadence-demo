import { Slider } from "@/components/ui/slider";
import { Box } from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";

export default function Form() {
  const [value, setValue] = useState([95, 165]);

  async function fetchSongs() {
    const token = localStorage.getItem("access_token");

    try {
      const result = await axios.get(
        "https://api.spotify.com/v1/recommendations",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            min_tempo: value[0], // Minimum BPM
            max_tempo: value[1], // Maximum BPM
            seed_genres: "classical,country",
            seed_tracks: "0c6xIDDpzE81m2q797ordA",
            seed_artists: "4NHQUGzhtTLFvgF5SZesLK",

            // Add other parameters like seed_genres, seed_artists, or seed_tracks if needed
          },
        }
      );
      const songs = result.data.tracks;
      console.log(songs);
    } catch (error) {
      console.error("Error fetching songs");
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
        <Checkbox variant="subtle">Use my library</Checkbox>
        <Slider
          colorPalette="white"
          label="BPM"
          value={value}
          min={30}
          max={300}
          onValueChange={(e) => setValue(e.value)}
          width="200px"
          step={1}
        />
        <Box mt={4}>
          Selected BPM Range: {value[0]} - {value[1]}
        </Box>
        <Button type="submit">Generate songs</Button>
      </form>
    </>
  );
}
