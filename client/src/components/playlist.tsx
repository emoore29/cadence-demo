import { Checkbox } from "@/components/ui/checkbox";
import { Track } from "@/types/types";
import { Button, Input } from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";

interface PlaylistProps {
  playlist: Track[] | null;
}

export default function Playlist({ playlist }: PlaylistProps) {
  if (!playlist) return <div>No playlist available</div>;
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [privatePlaylist, setPrivatePlaylist] = useState<boolean>(false);

  // Creates a new playlist on Spotify and then saves cadence playlist to it (2 separate post requests)
  async function savePlaylist() {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user_data");
    const songUris = playlist!.map((song) => `spotify:track:${song.id}`);
    let userId;

    if (user) {
      const parsedUser = JSON.parse(user); // Parse the string into a JavaScript object
      console.log("user", parsedUser);

      userId = parsedUser.id; // Access the id property from the parsed object
      console.log("user id", userId);
    } else {
      console.error("No user data found in localStorage.");
    }

    // Prepare the playlist data
    const playlistData = {
      name: name,
      description: description,
      public: !privatePlaylist,
    };

    // Create the new playlist
    try {
      const result = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        playlistData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const playlistId = result.data.id;

      // Add items to playlist
      try {
        const res = await axios.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            uris: songUris,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error adding items to playlist:", error);
      }

      console.log("Playlist created successfully:", result.data);
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  }

  return (
    <form
      className="playlist-form"
      onSubmit={(e) => {
        e.preventDefault();
        savePlaylist();
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your playlist name"
      />
      <Input
        placeholder="Playlist description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {playlist &&
        playlist.map((song) => {
          return (
            <>
              <a href={song.external_urls.spotify}>
                {song.name}, {song.artists[0].name}
              </a>
              <br />
            </>
          );
        })}
      <Checkbox
        checked={privatePlaylist}
        onCheckedChange={(e) => setPrivatePlaylist(!!e.checked)}
      >
        Private
      </Checkbox>
      <Button type="submit">Save playlist</Button>
    </form>
  );
}
