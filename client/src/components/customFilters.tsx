import { getAvailableGenreSeeds } from "@/helpers/fetchers";
import { TextInput, MultiSelect } from "@mantine/core";
import { useEffect, useState } from "react";

export default function CustomFilters() {
  const [availableGenreSeeds, setAvailableGenreSeeds] = useState<string[]>([
    "test",
    "genre",
  ]);

  async function getGenres() {
    const availableGenres: string[] | null = await getAvailableGenreSeeds();
    if (!availableGenres) return;

    setAvailableGenreSeeds(availableGenres);
  }

  useEffect(() => {
    getGenres();
    console.log(availableGenreSeeds);
  }, []);

  return (
    <>
      <form className="artistForm">
        <TextInput label="Artist" placeholder="Input placeholder" />
      </form>
      <form className="trackForm">
        <TextInput label="Artist" placeholder="Input placeholder" />
      </form>

      <MultiSelect
        label="Genre"
        placeholder="Pick some"
        data={availableGenreSeeds}
        searchable
      />
    </>
  );
}
