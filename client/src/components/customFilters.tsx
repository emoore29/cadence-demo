import { getAvailableGenreSeeds } from "@/helpers/fetchers";
import { ChosenSeeds } from "@/types/types";
import { useEffect, useState } from "react";
import { AsyncAutocomplete } from "./asyncAutocomplete";
import { SearchableMultiSelect } from "./searchableMultiSelect";

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
    const availableGenres: string[] | null = await getAvailableGenreSeeds();
    if (!availableGenres) return;

    setAvailableGenreSeeds(availableGenres);
  }

  useEffect(() => {
    getGenres();
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
