import { showErrorNotif, showSuccessNotif } from "@/helpers/general";
import { savePlaylist } from "@/helpers/playlist";
import { PlaylistData, TrackObject } from "@/types/types";
import { Button, Checkbox, Modal, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";

interface SavePlaylistModalProps {
  playlist: Map<string, TrackObject>;
  openSavePlaylist: boolean;
  setOpenSavePlaylist: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SavePlaylistModal({
  playlist,
  openSavePlaylist,
  setOpenSavePlaylist,
}: SavePlaylistModalProps) {
  const isMobile = useMediaQuery("(max-width: 50em)");
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      name: "Cadence playlist",
      description: "Cadence playlist description",
      public: true,
    },
  });

  async function handleSubmit(
    formValues: PlaylistData,
    playlist: Map<string, TrackObject>
  ) {
    const savedPlaylist = await savePlaylist(playlist, formValues);
    if (savedPlaylist) {
      showSuccessNotif(
        "Playlist saved",
        "Your playlist was successfully saved."
      );
      setOpenSavePlaylist(false);
    } else {
      showErrorNotif("Error", "Your playlist could not be saved.");
    }
  }

  return (
    <Modal.Root
      opened={openSavePlaylist}
      onClose={() => setOpenSavePlaylist(false)}
      fullScreen={isMobile}
      centered
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Save Playlist</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <form
            className="playlistForm"
            onSubmit={form.onSubmit((values) => handleSubmit(values, playlist))}
          >
            <TextInput
              label="Playlist Name"
              placeholder="Cadence: Playlist Name"
              key={form.key("name")}
              {...form.getInputProps("name")}
            />
            <TextInput
              label="Playlist Description"
              placeholder="Playlist generated with cadence"
              key={form.key("description")}
              {...form.getInputProps("description")}
            />
            <Checkbox
              label="Public"
              key={form.key("public")}
              {...form.getInputProps("public", { type: "checkbox" })}
            />
            <Button type="submit">Save playlist</Button>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
