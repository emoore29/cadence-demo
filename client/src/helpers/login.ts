import { User } from "@/types/types";
import { fetchLibrarySize, fetchUserData } from "./fetchers";
import { storeDataInLocalStorage, storeTokens } from "./localStorage";

// Helper function to get tokens from the URL hash
interface Tokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: string | null;
}

function getTokensFromHash(): Tokens {
  const hash = window.location.hash;
  const accessToken: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("access_token");
  const refreshToken: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("refresh_token");
  const expiresIn: string | null = new URLSearchParams(
    hash.replace("#", "?")
  ).get("expires_in");

  return { accessToken, refreshToken, expiresIn };
}

// Checks whether user has just logged in
export function loginOccurred(): boolean {
  const { accessToken, refreshToken, expiresIn } = getTokensFromHash();
  return accessToken !== null && refreshToken !== null && expiresIn !== null;
}

// Sets and stores login tokens, user data, and library size
export async function handleLogin(
  setLibSize: (size: number) => void,
  setUser: (user: User) => void
): Promise<void> {
  const { accessToken, refreshToken, expiresIn } = getTokensFromHash();

  if (accessToken && refreshToken && expiresIn) {
    storeTokens(accessToken, refreshToken, expiresIn);
    window.location.hash = "";

    // Fetch and store user's data
    const user: User | null = await fetchUserData();
    if (user) {
      storeDataInLocalStorage("user_data", user);
      setUser(user);
    }

    // Fetch and store user's library size
    const libSize: number | null = await fetchLibrarySize();
    if (libSize) {
      storeDataInLocalStorage("lib_size", libSize);
      setLibSize(libSize);
    }
  }
}
