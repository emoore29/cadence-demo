import { getAvailableGenreSeeds } from "@/helpers/fetchers";
import {
  getItemFromLocalStorage,
  storeDataInLocalStorage,
} from "@/helpers/localStorage";
import { handleTokens } from "@/helpers/tokens";
import { ChosenSeeds } from "@/types/types";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { AsyncAutocomplete } from "../AsyncAutocomplete/asyncAutocomplete";
import { SearchableMultiSelect } from "../SearchableMultiSelect/searchableMultiSelect";

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
  const user = getItemFromLocalStorage("user_data");
  const icon = <IconInfoCircle />;

  async function getGenres() {
    await handleTokens(); // Check for access token expiry before fetching genres
    const availableGenres: string[] | null = await getAvailableGenreSeeds();
    if (!availableGenres) return;

    setAvailableGenreSeeds(availableGenres);
    storeDataInLocalStorage("genres", availableGenres);
  }

  useEffect(() => {
    const storedGenres: string | null = getItemFromLocalStorage("genres");
    if (!storedGenres) {
      getGenres();
    } else {
      setAvailableGenreSeeds(JSON.parse(storedGenres));
    }
  }, []);

  return (
    <div>
      {!user ? (
        "Sign in to add custom playlist seeds."
      ) : (
        <>
          <p style={{ fontSize: "14px", padding: "5px 0" }}>
            Add up to five seeds to get customised recommendations.
          </p>
          <Alert
            variant="light"
            color="grape"
            title="Demo only"
            icon={icon}
            style={{ marginBottom: "20px" }}
          >
            Recommendations are now deprecated. Read more{" "}
            <a href="https://github.com/emoore29/cadence-demo" target="_blank">
              here
            </a>
            .
          </Alert>
          <SearchableMultiSelect
            data={availableGenreSeeds}
            setChosenSeeds={setChosenSeeds}
          />
          <AsyncAutocomplete setChosenSeeds={setChosenSeeds} type="artist" />
          <AsyncAutocomplete setChosenSeeds={setChosenSeeds} type="track" />
        </>
      )}
    </div>
  );
}
