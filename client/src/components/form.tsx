import { checkSavedTracks } from "@/helpers/fetchers";
import { showWarnNotif, syncSpotifyAndIdb } from "@/helpers/general";
import {
  filterFromStore,
  getRecommendations,
  startSearch,
} from "@/helpers/playlist";
import { ChosenSeeds, FormValues, TrackObject } from "@/types/types";
import {
  Accordion,
  Button,
  Checkbox,
  CheckIcon,
  Group,
  NumberInput,
  Progress,
  Radio,
  Select,
  Tabs,
  Tooltip,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconInfoCircle } from "@tabler/icons-react";
import CustomFilters from "./customFilters";
import { useEffect, useState } from "react";

interface FormProps {
  activeSourceTab: string | null;
  setActiveSourceTab: React.Dispatch<React.SetStateAction<string | null>>;
  loadingData: boolean;
  loadingDataProgress: number;
  storeMyData: () => void;
  libraryStored: boolean;
  playlist: Map<string, TrackObject>;
  setPlaylist: React.Dispatch<React.SetStateAction<Map<string, TrackObject>>>;
  matchingTracks: Map<string, TrackObject>;
  setMatchingTracks: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject>>
  >;
  setRecommendations: React.Dispatch<
    React.SetStateAction<Map<string, TrackObject>>
  >;
  setLoadingPlaylist: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingRecs: React.Dispatch<React.SetStateAction<boolean>>;
  form: UseFormReturnType<FormValues>;
  anyTempo: boolean;
  setAnyTempo: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Form({
  activeSourceTab,
  setActiveSourceTab,
  loadingData,
  loadingDataProgress,
  storeMyData,
  libraryStored,
  playlist,
  setPlaylist,
  setMatchingTracks,
  setRecommendations,
  setLoadingPlaylist,
  setLoadingRecs,
  form,
  anyTempo,
  setAnyTempo,
}: FormProps) {
  const [chosenSeeds, setChosenSeeds] = useState<ChosenSeeds>({
    genres: [],
    tracks: [],
    artists: [],
  });

  async function handleSubmit(
    values: FormValues,
    anyTempo: boolean,
    activeSourceTab: string | null
  ) {
    // Mark playlist and recs as loading so that loading components are displayed
    setLoadingPlaylist(true);

    // Search for matching tracks
    const matchingTracks: Map<string, TrackObject> | null | void =
      await startSearch(values, anyTempo, activeSourceTab, chosenSeeds);
    if (!matchingTracks) {
      showWarnNotif(
        "No matches found",
        "No tracks could be found that meet that criteria."
      );
      setPlaylist(new Map());
      setRecommendations(new Map());
      setMatchingTracks(new Map());
      setLoadingPlaylist(false);
      setLoadingRecs(false);
      return;
    }

    // Remove any tracks from matchingTracks that are already pinned in the playlist
    for (const key of matchingTracks.keys()) {
      if (playlist?.get(key)) {
        if (playlist.get(key)?.pinned) {
          matchingTracks.delete(key);
        }
      }
    }

    // If user is filtering their saved tracks
    // Remove tracks from matchingTracks that were returned but have synced as unsaved
    if (values.source === "2") {
      for (const key of matchingTracks.keys()) {
        const track = playlist.get(key);
        if (track && !track.saved) {
          matchingTracks.delete(key);
        }
      }
    }

    // If after removing pinned tracks/unsaved tracks from matches, matchingTracks.size is 0,
    // Return no matches found
    if (matchingTracks.size === 0) {
      showWarnNotif(
        "No matches found",
        "No tracks could be found that meet that criteria."
      );
      setPlaylist(new Map());
      setRecommendations(new Map());
      setMatchingTracks(new Map());
      setLoadingPlaylist(false);
      setLoadingRecs(false);
      return;
    }

    // Check if matching tracks are saved in Spotify library
    const syncedSpotifySaveStatusTracks: Map<string, TrackObject> | null =
      await checkSavedTracks(matchingTracks);
    if (!syncedSpotifySaveStatusTracks) return;

    // For each matching track, sync IDB saved tracks library with the Spotify saved status
    // E.g. if one track is marked as unsaved in spotify but is saved in IDB, remove it from IDB
    for (const trackObject of matchingTracks.values()) {
      syncSpotifyAndIdb(trackObject, trackObject.saved); // Adds or removes track from IDB depending on Spotify saved status
    }

    // Initialise newPlaylist
    let newPlaylist: Map<string, TrackObject> = new Map();

    // Add pinned tracks to newPlaylist
    if (playlist) {
      for (const [key, value] of playlist.entries()) {
        if (value.pinned === true) {
          newPlaylist.set(key, value);
        }
      }
    }

    // Add matching tracks to newPlaylist up to the target size
    if (newPlaylist.size < values.target) {
      const missingNumber: number = values.target - newPlaylist.size;

      // Slice matchingTracks to be the size of missingNumber, then add to newPlaylist
      const tempArray = Array.from(matchingTracks).slice(0, missingNumber);
      const newMap = new Map(tempArray);

      // Remove the matching tracks being added to the newPlaylist from matchingTracks
      for (const key of newMap.keys()) {
        matchingTracks.delete(key);
      }

      newPlaylist = new Map([...newPlaylist, ...newMap]);
    }

    setLoadingPlaylist(false);
    setPlaylist(newPlaylist);
    setMatchingTracks(matchingTracks);

    // Fetch up to 100 recs (only the first 3 will be displayed in the Recommendations component)
    // Note: Spotify is not guaranteed to return 100
    // Commented out as fetching recommendations no longer functions due to API deprecation.

    if (activeSourceTab === "mySpotify") {
      setLoadingRecs(true);
      // const recs: Map<string, TrackObject> | null = await getRecommendations(
      //   values,
      //   { anyTempo, targetRecs: 100 }
      // );

      // Replace above with filtering demo recommendations
      const recs: Map<string, TrackObject> | null = await filterFromStore(
        "recommendations",
        values,
        anyTempo
      );

      // Remove any tracks that are already in the playlist
      if (recs) {
        for (const key of recs.keys()) {
          if (playlist?.get(key)) {
            recs.delete(key);
          }
        }
        if (recs.size > 0) {
          setRecommendations(recs);
          setLoadingRecs(false);
        }
      }
    }
  }

  return (
    <>
      {" "}
      <form
        className="form"
        onSubmit={form.onSubmit((values) =>
          handleSubmit(values, anyTempo, activeSourceTab)
        )}
        onReset={form.onReset}
      >
        <h2 id="filters">Filters</h2>
        <Accordion defaultValue="Tracks Source">
          <Accordion.Item value="Tracks Source">
            <Accordion.Control>Tracks Source</Accordion.Control>
            <Accordion.Panel>
              <Tabs value={activeSourceTab} onChange={setActiveSourceTab}>
                <Tabs.List>
                  <Tabs.Tab value="custom">Custom</Tabs.Tab>
                </Tabs.List>
                <Tabs.List>
                  <Tabs.Tab value="mySpotify">My Spotify</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="custom">
                  <CustomFilters setChosenSeeds={setChosenSeeds} />
                </Tabs.Panel>
                <Tabs.Panel value="mySpotify">
                  {!libraryStored ? (
                    <div className="loadLibraryOverlay">
                      <p style={{ fontSize: "14px" }}>
                        {!loadingData ? "Load " : "Loading "}demo tracks
                      </p>
                      {!loadingData ? (
                        <Button
                          onClick={storeMyData}
                          style={{ maxWidth: "100%", whiteSpace: "wrap" }}
                        >
                          Load my library
                        </Button>
                      ) : (
                        <Progress
                          value={loadingDataProgress}
                          size="lg"
                          transitionDuration={200}
                        />
                      )}
                    </div>
                  ) : (
                    <Radio.Group
                      name="source"
                      label="Source"
                      {...form.getInputProps("source")}
                    >
                      <Group
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          textAlign: "left",
                        }}
                      >
                        <Radio
                          className="sourceFilterRadio"
                          value={"1"}
                          icon={CheckIcon}
                          label="Saved Songs"
                        />
                        <Radio
                          value={"2"}
                          icon={CheckIcon}
                          label="Top Tracks"
                        />
                        <Radio
                          value={"3"}
                          icon={CheckIcon}
                          label="Recommendations"
                        />
                      </Group>
                    </Radio.Group>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="Target Length">
            <Accordion.Control>Target Length</Accordion.Control>
            <Accordion.Panel>
              <NumberInput
                label="Target number of tracks"
                key={form.key("target")}
                placeholder="20"
                {...form.getInputProps("target")}
                stepHoldDelay={500}
                stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
              />
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="BPM">
            <Accordion.Control>Tempo</Accordion.Control>
            <Accordion.Panel>
              <Checkbox
                checked={anyTempo}
                label="Any"
                onChange={(event) => {
                  const isChecked = event.currentTarget.checked;
                  setAnyTempo(isChecked);
                }}
              />
              <div className="bpm">
                <NumberInput
                  label="Min Tempo"
                  key={form.key("minTempo")}
                  placeholder="Input placeholder"
                  disabled={anyTempo}
                  {...form.getInputProps("minTempo")}
                  stepHoldDelay={500}
                  stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
                />
                <NumberInput
                  label="Max Tempo"
                  key={form.key("maxTempo")}
                  placeholder="Input placeholder"
                  disabled={anyTempo}
                  {...form.getInputProps("maxTempo")}
                  stepHoldDelay={500}
                  stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
                />
              </div>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="Advanced">
            <Accordion.Control>Advanced</Accordion.Control>
            <Accordion.Panel>
              <Tooltip
                multiline
                w={220}
                label="Advanced filters are subjective and may limit results more than desired."
                events={{ hover: true, focus: true, touch: false }}
                position="right"
              >
                <IconInfoCircle
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  size={22}
                  stroke={2}
                />
              </Tooltip>
              {[
                "Valence",
                "Danceability",
                "Energy",
                "Instrumentalness",
                "Acousticness",
              ].map((filter: string) => (
                <Select
                  key={form.key(`target` + filter)}
                  {...form.getInputProps(`target` + filter)}
                  label={filter}
                  data={["Any", "Low", "Medium", "High"]}
                  allowDeselect={false}
                />
              ))}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Group justify="flex-end" mt="md">
          <Button type="reset" onClick={() => setAnyTempo(false)}>
            Reset
          </Button>
          <Button type="submit">Submit</Button>
        </Group>
      </form>
    </>
  );
}
