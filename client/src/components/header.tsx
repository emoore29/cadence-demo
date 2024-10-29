import { useState } from "react";
import { User } from "../types/types";
import { clearLocalStorage } from "@/helpers/frontend";
import { deleteDatabase } from "@/helpers/database";

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
  const [userMenu, setUserMenu] = useState<boolean>(false);

  const logOut = () => {
    // Remove everything from local storage and store
    clearLocalStorage();
    deleteDatabase();
    setUser(null);
    setLibSize(0);
    setLibraryStored(false);
  };

  const showUserMenu = () => {
    setUserMenu((prev) => !prev);
  };

  return (
    <div className="header">
      <h1>cadence</h1>
      {user ? (
        <div id="user-menu">
          <button id="user-btn" onClick={showUserMenu}>
            <img id="user-img" src={user.images[1].url} alt="" />
          </button>
          {userMenu && <button onClick={logOut}>logout</button>}
        </div>
      ) : (
        <a href="http://localhost:3000/login">login</a>
      )}
    </div>
  );
}
