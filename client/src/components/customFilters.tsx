import {
  getAvailableGenreSeeds,
  searchForArtist,
  searchForTrack,
} from "@/helpers/fetchers";
import { Artist, TrackObject } from "@/types/types";
import { TextInput, MultiSelect, Button, Modal } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";

interface SavePlaylistModalProps {
  openCustomFilters: boolean;
  setOpenCustomFilters: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CustomFilters({
  openCustomFilters,
  setOpenCustomFilters,
}: SavePlaylistModalProps) {
  const [availableGenreSeeds, setAvailableGenreSeeds] = useState<string[]>([
    "acoustic",
    "ambient",
    "bossanova",
    "indie",
    "rock",
  ]);
  const artistForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      artist: "",
    },
  });
  const trackForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      track: "",
    },
  });
  const [artists, setArtists] = useState<Artist[]>([]);
  const [trackResults, setTrackResults] = useState<TrackObject[]>([]);

  async function getGenres() {
    const availableGenres: string[] | null = await getAvailableGenreSeeds();
    if (!availableGenres) return;

    setAvailableGenreSeeds(availableGenres);
  }

  useEffect(() => {
    getGenres();
  }, []);

  async function handleArtistSubmit(values) {
    console.log(values.artist);
    const artistSearchResults: Artist[] | null = await searchForArtist(
      values.artist
    );
    artistSearchResults && setArtists(artistSearchResults);
  }

  async function handleTrackSubmit(values) {
    console.log(values.track);
    const trackSearchResults: TrackObject[] | null = await searchForTrack(
      values.track
    );
    trackSearchResults && setTrackResults(trackSearchResults);
  }

  return (
    <Modal.Root
      opened={openCustomFilters}
      onClose={() => setOpenCustomFilters(false)}
      centered
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Custom Playlist Seeds</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <div>
            <form
              className="artistForm"
              onSubmit={artistForm.onSubmit((values) =>
                handleArtistSubmit(values)
              )}
            >
              <TextInput
                label="Artist"
                placeholder="Input placeholder"
                key={artistForm.key("artist")}
                {...artistForm.getInputProps("artist")}
              />
              <Button type="submit">Find</Button>
              {artists &&
                artists.map((artistObj) => <div>{artistObj.name}</div>)}
            </form>
            <form
              className="trackForm"
              onSubmit={trackForm.onSubmit((values) =>
                handleTrackSubmit(values)
              )}
            >
              <TextInput
                label="Track"
                placeholder="Input placeholder"
                key={trackForm.key("track")}
                {...trackForm.getInputProps("track")}
              />
              <Button type="submit">Find</Button>
              {trackResults &&
                trackResults.map((trackObj) => <div>{trackObj.name}</div>)}
            </form>
            <MultiSelect
              label="Genre"
              placeholder="Select one or more genres"
              data={availableGenreSeeds}
              searchable
            />
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
