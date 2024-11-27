import { getAvailableGenreSeeds } from "@/helpers/fetchers";
import { ChosenSeeds } from "@/types/types";
import { useEffect, useState } from "react";
import { AsyncAutocomplete } from "./asyncAutocomplete";
import { SearchableMultiSelect } from "./searchableMultiSelect";
import { handleTokens } from "@/helpers/tokens";
import {
  getItemFromLocalStorage,
  storeDataInLocalStorage,
} from "@/helpers/localStorage";

interface CustomFiltersProps {
  setChosenSeeds: React.Dispatch<React.SetStateAction<ChosenSeeds>>;
}

export default function CustomFilters({ setChosenSeeds }: CustomFiltersProps) {
  const [availableGenreSeeds, setAvailableGenreSeeds] = useState<string[]>([
    "acoustic",
    "ambient",
    "bossanova",
    "indie",
    "rock",
  ]);

  async function getGenres() {
    await handleTokens(); // Check for access token expiry before fetching genres
    const availableGenres: string[] | null = await getAvailableGenreSeeds();
    if (!availableGenres) return;

    console.log("available genres", availableGenres);
    setAvailableGenreSeeds(availableGenres);
    storeDataInLocalStorage("genres", availableGenres);
  }

  useEffect(() => {
    const storedGenres: string | null = getItemFromLocalStorage("genres");
    if (!storedGenres) {
      getGenres();
    } else {
      console.log(
        "genres already stored. parsed:",
        typeof JSON.parse(storedGenres)
      );
      setAvailableGenreSeeds(JSON.parse(storedGenres));
    }
  }, []);

  return (
    <div>
      At least two categories must have input. At most 5 inputs.
      <SearchableMultiSelect
        data={availableGenreSeeds}
        setChosenSeeds={setChosenSeeds}
      />
      <AsyncAutocomplete setChosenSeeds={setChosenSeeds} type="artist" />
      <AsyncAutocomplete setChosenSeeds={setChosenSeeds} type="track" />
    </div>
  );
}
