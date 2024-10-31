import { deleteDatabase } from "@/helpers/database";
import { clearLocalStorage } from "@/helpers/localStorage";
import { Menu } from "@mantine/core";
import { User } from "../types/types";

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
  };

  const clearData = () => {
    clearLocalStorage();
    deleteDatabase();
  };

  return (
    <div className="header">
      <h1>cadence</h1>
      <Menu position="bottom-end" offset={1} shadow="md" width={200}>
        <Menu.Target>
          {user ? (
            <img id="user-img" src={user.images[1].url} alt="" />
          ) : (
            <a href="http://localhost:3000/login">login</a>
          )}
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={clearData}>Clear my data</Menu.Item>
          <Menu.Item color="red" onClick={logOut}>
            Log out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}
