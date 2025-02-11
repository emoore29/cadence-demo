import {
  CheckIcon,
  Combobox,
  Group,
  Pill,
  PillsInput,
  ScrollArea,
  useCombobox,
} from "@mantine/core";
import React, { useState } from "react";

// Component taken and modified from Mantine example component
// https://mantine.dev/combobox/?e=BasicMultiSelect

interface SearchableMultiSelectProps {
  data: string[];
  setChosenItems: React.Dispatch<React.SetStateAction<string[]>>;
}

export function SearchableMultiSelect({
  data,
  setChosenItems,
}: SearchableMultiSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex("active"),
  });

  const [search, setSearch] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  function handleValueSelect(val: string) {
    setSearch("");
    combobox.closeDropdown();
    setSelectedValues((current) =>
      current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val]
    );
    setChosenItems((prev) => [...prev, val]);
  }

  const handleValueRemove = (val: string) => {
    setSelectedValues((current) => current.filter((v) => v !== val));
    setChosenItems((prev) => prev.filter((v) => v !== val));
  };

  // Chosen values
  const values = selectedValues.map((item) => (
    <Pill key={item} withRemoveButton onRemove={() => handleValueRemove(item)}>
      {item}
    </Pill>
  ));

  // Options to choose from
  const options = data
    .filter((item) => item.toLowerCase().includes(search.trim().toLowerCase()))
    .map((item) => (
      <Combobox.Option
        value={item}
        key={item}
        active={selectedValues.includes(item)}
      >
        <Group gap="sm">
          {selectedValues.includes(item) ? <CheckIcon size={12} /> : null}
          <span>{item}</span>
        </Group>
      </Combobox.Option>
    ));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={handleValueSelect}
      withinPortal={false}
    >
      <Combobox.DropdownTarget>
        <PillsInput onClick={() => combobox.openDropdown()}>
          <Pill.Group>
            {values}
            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                value={search}
                placeholder="Search tags"
                onChange={(event) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && search.length === 0) {
                    event.preventDefault();
                    handleValueRemove(
                      selectedValues[selectedValues.length - 1]
                    );
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>
      <Combobox.Dropdown>
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
