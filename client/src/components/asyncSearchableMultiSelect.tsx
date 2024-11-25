import { useEffect, useRef, useState } from "react";
import {
  Combobox,
  Loader,
  TextInput,
  useCombobox,
  Pill,
  Group,
  CheckIcon,
  PillsInput,
} from "@mantine/core";
import { debounce, mapValues } from "lodash";
import { searchForArtist, searchForTrack } from "@/helpers/fetchers";
import { Artist, Track } from "@/types/types";

// Component taken and modified from Mantine example component
// https://mantine.dev/combobox/?e=AsyncAutocomplete

interface AsyncAutocompleteProps {
  type: "track" | "artist";
  setChosenTracks?: React.Dispatch<React.SetStateAction<Track[]>>;
  setChosenArtists?: React.Dispatch<React.SetStateAction<Artist[]>>;
}

export function AsyncAutocomplete({
  type,
  setChosenArtists,
  setChosenTracks,
}: AsyncAutocompleteProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Track[] | Artist[] | null>(null);
  const [values, setValues] = useState<(Track | Artist)[]>([]);
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
      searchForArtist(
        query,
        abortController,
        abortController.current.signal,
        setData,
        setLoading
      );
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

  // Cancel debounced function if the component unmounts
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  function handleValueRemove(val: string) {
    setValues((currentVals) => {
      console.log("filtering vals");
      return currentVals.filter((obj) => obj.id !== val);
    });
  }

  // Displays data in Comboboxes
  const options = (data || []).map((obj) => (
    <Combobox.Option value={obj.id} key={obj.id} active={values.includes(obj)}>
      <Group gap="sm">
        {values.includes(obj) ? <CheckIcon size={12} /> : null}
        <span>
          {obj.name}
          {"artists" in obj ? ` - ${obj.artists[0].name}` : ""}
        </span>
      </Group>
    </Combobox.Option>
  ));

  // Displays selected options in pills
  const pillValues = values?.map((obj) => (
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
    // Get object from data using id
    const chosenOption: Track | Artist | undefined = data?.find(
      (obj) => obj.id === optionId
    );

    // If object exists in data, add it to values
    if (chosenOption) {
      // Add object to values
      setValues((current) =>
        current.includes(chosenOption)
          ? current.filter((v) => v !== chosenOption)
          : [...current, chosenOption]
      );
    }
  }

  return (
    <Combobox
      onOptionSubmit={handleOptionSelect}
      withinPortal={false}
      store={combobox}
    >
      <Combobox.DropdownTarget>
        <PillsInput onClick={() => combobox.openDropdown()}>
          <Pill.Group>
            {pillValues}
            <Combobox.EventsTarget>
              <PillsInput.Field
                placeholder={
                  type === "track" ? "Type a track name" : "Type an artist name"
                }
                value={search}
                onChange={(event) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);
                  if (event.currentTarget.value.length < 1) {
                    console.log("clearing data");
                    setData(null);
                  }

                  if (event.currentTarget.value.length > 0) {
                    fetchOptions(event.currentTarget.value);
                  }

                  combobox.resetSelectedOption();
                  combobox.openDropdown();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && search.length === 0) {
                    event.preventDefault();
                    handleValueRemove(values[values.length - 1]);
                  }
                }}
                onClick={() => combobox.openDropdown()}
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                //     rightSection={loading && <Loader size={18}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown hidden={data === null}>
        <Combobox.Options>
          {options.length > 0 ? (
            options
          ) : (
            <Combobox.Empty>Nothing found...</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
