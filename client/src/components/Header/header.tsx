import { deleteDatabase } from "@/helpers/database";
import { showSuccessNotif } from "@/helpers/general";
import { storeDataInLocalStorage } from "@/helpers/localStorage";
import { Menu, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconMetronome } from "@tabler/icons-react";
import { TrackObject, User } from "../../types/types";
import styles from "./header.module.css";

interface HeaderProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setLibraryStored: (libraryStored: boolean) => void;
  setPlaylist: React.Dispatch<React.SetStateAction<Map<string, TrackObject>>>;
}

export default function Header({
  user,
  setUser,
  setLibraryStored,
  setPlaylist,
}: HeaderProps) {
  const logOut = () => {
    // Remove everything from local storage and store
    setPlaylist(new Map());
    localStorage.clear();
    deleteDatabase();
    setUser(null);
    setLibraryStored(false);
    showSuccessNotif("Success", "You successfully logged out.");
  };

  const clearData = () => {
    setPlaylist(new Map());
    deleteDatabase();
    setLibraryStored(false);
    storeDataInLocalStorage("library_was_stored", false);
    showSuccessNotif("Success", "Track data was removed from browser storage.");
  };

  const openConfirmClearDataModal = () =>
    modals.openConfirmModal({
      title: "Are you sure?",
      children: (
        <Text size="sm">
          This will remove your track data. You will need to reload your data if
          you want to create playlists from it again.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => clearData(),
    });

  const openConfirmLogoutModal = () =>
    modals.openConfirmModal({
      title: "Are you sure?",
      children: (
        <Text size="sm">
          This will remove your saved data and you will need to provide
          authorization again if you wish to use the full features of Cadence.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => logOut(),
    });

  return (
    <div className={styles.header}>
      <div className={styles.titleAndLogo}>
        <IconMetronome className={styles.metronomeIcon} size={32} stroke={2} />
        <h1>cadence</h1>
      </div>
      {user ? (
        <Menu position="bottom-end" offset={1} shadow="md" width={120}>
          <Menu.Target>
            <img
              className={styles.userImg}
              src={user.images[1].url}
              alt="Spotify account profile image."
            />
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              className={styles.menuItem}
              onClick={openConfirmClearDataModal}
            >
              Clear track storage
            </Menu.Item>
            <Menu.Item
              className={styles.menuItem}
              onClick={openConfirmLogoutModal}
            >
              Log out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <a href={`/api/spotify/login`} style={{ color: "rgba(255,255,255,1)" }}>
          Sign in
        </a>
      )}
    </div>
  );
}
