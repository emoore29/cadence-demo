import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import Header from "./components/header";
import { User } from "./types/types";
import { checkTokenExpiry } from "./helpers/helpers";
import Form from "./components/form";

function App() {
  const [user, setUser] = useState<User | null>(null);

  async function fetchUser(token: string) {
    const result = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = result.data;
    localStorage.setItem("user_data", JSON.stringify(user));
    setUser(user);
  }

  useEffect(() => {
    const hash = window.location.hash;
    const accessToken = new URLSearchParams(hash.replace("#", "?")).get(
      "access_token"
    );
    const refreshToken = new URLSearchParams(hash.replace("#", "?")).get(
      "refresh_token"
    );
    const expiresIn = new URLSearchParams(hash.replace("#", "?")).get(
      "expires_in"
    );
    if (accessToken && refreshToken && expiresIn) {
      // Case 1: User has just been redirected from authorizing the app
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      const expiryTime = Date.now() + parseInt(expiresIn, 10);
      localStorage.setItem("token_expiry", expiryTime.toString());
      window.location.hash = "";
      fetchUser(accessToken);
    } else {
      // Case 2: Tokens and user data are stored in local storage or user has not authorized yet
      checkTokenExpiry();
      const storedUserData = localStorage.getItem("user_data");
      if (storedUserData) {
        setUser(JSON.parse(storedUserData));
      }
      const interval = setInterval(checkTokenExpiry, 3600000); // Check for expiry after 1 hour
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="container">
      <Header user={user} setUser={setUser} />
      <Form />
    </div>
  );
}

export default App;
