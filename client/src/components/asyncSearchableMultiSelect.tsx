import { useEffect, useRef, useState } from "react";
import { Combobox, Loader, TextInput, useCombobox } from "@mantine/core";
import { debounce } from "lodash";
import { searchForArtist, searchForTrack } from "@/helpers/fetchers";
import { Artist, Track } from "@/types/types";

// Component taken and modified from Mantine example component
// https://mantine.dev/combobox/?e=AsyncAutocomplete

interface AsyncAutocompleteProps {
  type: string;
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
  const [value, setValue] = useState("");
  const [empty, setEmpty] = useState(false);
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
        setLoading,
        setEmpty
      );
    } else if (type === "track") {
      searchForTrack(
        query,
        abortController,
        abortController.current.signal,
        setData,
        setLoading,
        setEmpty
      );
    }
  }

  // Cancel debounced function if the component unmounts
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const options = (data || []).map((obj) => {
    if ("album" in obj) {
      return (
        <Combobox.Option value={obj.id} key={obj.id}>
          {obj.name}
        </Combobox.Option>
      );
    } else {
      return (
        <Combobox.Option value={obj.id} key={obj.id}>
          {obj.name}
        </Combobox.Option>
      );
    }
  });

  return (
    <Combobox
      onOptionSubmit={(optionId) => {
        const selectedOption: Artist | Track | undefined = (data || []).find(
          (obj) => obj.id === optionId
        );

        if (selectedOption) {
          setValue(selectedOption?.name);
          if (type === "artist") {
            setChosenArtists((prev) => [...prev, selectedOption]);
          } else if (type === "track") {
            setChosenTracks((prev) => [...prev, selectedOption]);
          }
        }

        combobox.closeDropdown();
      }}
      withinPortal={false}
      store={combobox}
    >
      <Combobox.Target>
        <TextInput
          label={type === "track" ? "Track" : "Artist"}
          placeholder={
            type === "track" ? "Type a track name" : "Type an artist name"
          }
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            if (event.currentTarget.value.length < 1) {
              console.log("clearing data");
              setData(null);
            }

            if (event.currentTarget.value.length > 1) {
              fetchOptions(event.currentTarget.value);
            }
            combobox.resetSelectedOption();
            combobox.openDropdown();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => {
            combobox.openDropdown();
            if (data === null) {
              fetchOptions(value);
            }
          }}
          onBlur={() => combobox.closeDropdown()}
          rightSection={loading && <Loader size={18} />}
        />
      </Combobox.Target>

      <Combobox.Dropdown hidden={data === null}>
        <Combobox.Options>
          {options}
          {empty && <Combobox.Empty>No results found</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
