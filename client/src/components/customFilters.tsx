import {
  getAvailableGenreSeeds,
  searchForArtist,
  searchForTrack,
} from "@/helpers/fetchers";
import {
  Artist,
  ArtistSeedForm,
  Track,
  TrackObject,
  TrackSeedForm,
} from "@/types/types";
import { TextInput, MultiSelect, Button, Modal } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { SearchableMultiSelect } from "./searchableMultiSelect";
import { AsyncAutocomplete } from "./asyncSearchableMultiSelect";

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

  const [artists, setArtists] = useState<Artist[]>([]);
  const [trackResults, setTrackResults] = useState<Track[]>([]);
  const [chosenGenres, setChosenGenres] = useState<string[]>([]);
  const [chosenArtists, setChosenArtists] = useState<Artist[]>([]);
  const [chosenTracks, setChosenTracks] = useState<Track[]>([]);

  async function getGenres() {
    const availableGenres: string[] | null = await getAvailableGenreSeeds();
    if (!availableGenres) return;

    setAvailableGenreSeeds(availableGenres);
  }

  useEffect(() => {
    getGenres();
  }, []);

  return (
    <Modal.Root
      opened={openCustomFilters}
      onClose={() => setOpenCustomFilters(false)}
      centered
      fullScreen
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Custom Playlist Seeds</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          Select at least two categories, at most 5 total.
          <SearchableMultiSelect
            data={availableGenreSeeds}
            setChosenGenres={setChosenGenres}
          />
          <AsyncAutocomplete
            setChosenArtists={setChosenArtists}
            type="artist"
          />
          <AsyncAutocomplete setChosenTracks={setChosenTracks} type="track" />
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
