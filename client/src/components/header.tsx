import { deleteDatabase } from "@/helpers/database";
import { clearLocalStorage } from "@/helpers/localStorage";
import { Menu, Text } from "@mantine/core";
import { User } from "../types/types";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconMetronome } from "@tabler/icons-react";

interface HeaderProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setLibSize: (libSize: number) => void;
  setLibraryStored: (libraryStored: boolean) => void;
}

export default function Header({
  user,
  setUser,
  setLibSize,
  setLibraryStored,
}: HeaderProps) {
  const logOut = () => {
    // Remove everything from local storage and store
    clearLocalStorage();
    deleteDatabase();
    setUser(null);
    setLibSize(0);
    setLibraryStored(false);
    () =>
      notifications.show({
        title: "Logged out",
        message: "Your data and authorization was removed.",
      });
  };

  const clearData = () => {
    clearLocalStorage();
    deleteDatabase();
    () =>
      notifications.show({
        title: "Cleared data",
        message: "Your data was removed.",
      });
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
    <div className="header">
      <IconMetronome size={32} stroke={2} />

      <h1>cadence</h1>

      {user ? (
        <Menu position="bottom-end" offset={1} shadow="md" width={200}>
          <Menu.Target>
            <img
              className="user-img"
              src={user.images[1].url}
              alt="Spotify account profile image."
            />
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={openConfirmClearDataModal}>
              Clear my data
            </Menu.Item>
            <Menu.Item color="red" onClick={openConfirmLogoutModal}>
              Log out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <a href="http://localhost:3000/login">login</a>
      )}
    </div>
  );
}
