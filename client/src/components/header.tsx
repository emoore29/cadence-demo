import { useState } from "react";
import { User } from "../types/types";

interface HeaderProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setLibSize: (libSize: number) => void;
}

export default function Header({ user, setUser, setLibSize }: HeaderProps) {
  const [userMenu, setUserMenu] = useState<boolean>(false);

  const logOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expiry");
    localStorage.removeItem("user_data");
    localStorage.removeItem("lib_size");
    setUser(null);
    setLibSize(0);
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
