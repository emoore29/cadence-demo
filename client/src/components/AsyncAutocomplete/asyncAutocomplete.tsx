import { searchForArtist, searchForTrack } from "@/helpers/fetchers";
import { showWarnNotif } from "@/helpers/general";
import { Artist, ChosenSeeds, Track } from "@/types/types";
import {
  CheckIcon,
  Combobox,
  Group,
  Loader,
  Pill,
  PillsInput,
  ScrollArea,
  useCombobox,
} from "@mantine/core";
import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";

// Component taken and modified from Mantine example component
// https://mantine.dev/combobox/?e=AsyncAutocomplete

interface AsyncAutocompleteProps {
  type: "track" | "artist";
  setChosenSeeds: React.Dispatch<React.SetStateAction<ChosenSeeds>>;
}

export function AsyncAutocomplete({
  type,
  setChosenSeeds,
}: AsyncAutocompleteProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Track[] | Artist[] | null>(null);
  const [selectedValues, setSelectedValues] = useState<(Track | Artist)[]>([]);
  const [search, setSearch] = useState("");
  const abortController = useRef<AbortController>();
  const debouncedSearch = useRef(debounce(fetchOptions, 300)).current;

  function fetchOptions(query: string) {
    abortController.current?.abort(); // If there's an ongoing request, abort will cancel it
    abortController.current = new AbortController(); // Creates a new AbortController for the new request
    setLoading(true);

    // Start a new search
    // Passing signal means the request can be cancelled as above if a new request is started
    if (type === "artist") {
      const success = searchForArtist(
        query,
        abortController,
        abortController.current.signal,
        setData,
        setLoading
      );
      if (!success) {
        showWarnNotif(
          "Sign in",
          "The feature you are trying to use requires you to be signed in."
        );
      }
    } else if (type === "track") {
      searchForTrack(
        query,
        abortController,
        abortController.current.signal,
        setData,
        setLoading
      );
    }
  }

  // Cancel debounced search if the component unmounts
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Remove value on X click or backspace
  function handleValueRemove(id: string) {
    setSelectedValues((currentVals) => {
      return currentVals.filter((obj) => obj.id !== id);
    });
    if (type === "track") {
      setChosenSeeds((prev) => ({
        ...prev,
        tracks: [...prev.tracks.filter((trackId) => trackId !== id)],
      }));
    } else if (type === "artist") {
      setChosenSeeds((prev) => ({
        ...prev,
        artists: [...prev.artists.filter((trackId) => trackId !== id)],
      }));
    }
  }

  // Displays data in Comboboxes
  const options = (data || []).map((obj) => (
    <Combobox.Option
      value={obj.id}
      key={obj.id}
      active={selectedValues.includes(obj)}
    >
      <Group gap="sm">
        {selectedValues.find((option) => option.id === obj.id) ? (
          <CheckIcon size={12} />
        ) : null}
        <span>
          {obj.name}
          {"artists" in obj ? ` - ${obj.artists[0].name}` : ""}
        </span>
      </Group>
    </Combobox.Option>
  ));

  // Displays selected options in pills
  const pillValues = selectedValues?.map((obj) => (
    <Pill
      key={obj.id}
      withRemoveButton
      onRemove={() => handleValueRemove(obj.id)}
    >
      {obj.name}
      {"artists" in obj ? ` - ${obj.artists[0].name}` : ""}
    </Pill>
  ));

  // Adds the selected option to values which are displayed as pills in input field
  function handleOptionSelect(optionId: string) {
    // Clear data
    setSearch("");
    setData(null);
    combobox.closeDropdown();
    // Get object from data using id
    const chosenOption: Track | Artist | undefined = data?.find(
      (obj) => obj.id === optionId
    );

    // If object exists in data, add it to values
    if (chosenOption) {
      // Add object to values, or remove it if it's already there
      setSelectedValues((current) =>
        current.find((option) => option.id === optionId)
          ? current.filter((option) => option.id !== optionId)
          : [...current, chosenOption]
      );

      // Add chosen option id to chosenTracks/chosenArtists
      if (type === "track") {
        setChosenSeeds((prev) => ({
          ...prev,
          tracks: [...prev.tracks, optionId],
        }));
      } else if (type === "artist") {
        setChosenSeeds((prev) => ({
          ...prev,
          artists: [...prev.artists, optionId],
        }));
      }
    }
  }

  useEffect(() => {
    if (search === "") {
      setData(null);
    }
  }, [search]);

  return (
    <Combobox
      onOptionSubmit={handleOptionSelect}
      withinPortal={false}
      store={combobox}
    >
      <Combobox.DropdownTarget>
        <PillsInput
          rightSection={loading && <Loader size={18} />}
          onClick={() => combobox.openDropdown()}
        >
          <Pill.Group>
            {pillValues}
            <Combobox.EventsTarget>
              <PillsInput.Field
                aria-label={
                  type === "track"
                    ? "Enter a track name"
                    : "Enter an artist name"
                }
                style={{ padding: "0" }}
                placeholder={
                  type === "track" ? "Search tracks" : "Search artists"
                }
                value={search}
                onChange={(event) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);

                  if (event.currentTarget.value.length > 0) {
                    fetchOptions(event.currentTarget.value);
                  }

                  combobox.resetSelectedOption();
                  combobox.openDropdown();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && search.length === 0) {
                    event.preventDefault();
                    setSelectedValues((current) => {
                      const newValues = [...current];
                      newValues.pop();
                      return newValues;
                    });
                  }
                }}
                onClick={() => combobox.openDropdown()}
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>
      <Combobox.Dropdown hidden={data === null}>
        <Combobox.Options>
          <ScrollArea.Autosize mah={200} type="scroll">
            {options.length > 0 ? (
              options
            ) : (
              <Combobox.Empty>Nothing found...</Combobox.Empty>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
