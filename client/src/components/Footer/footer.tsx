import { IconSearch } from "@tabler/icons-react";
import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerInfo}>
        Built by{" "}
        <a href="https://github.com/emoore29" target="_blank">
          Emma Moore
        </a>
      </p>
      <p className={styles.footerInfo}>
        Sample data provided by{" "}
        <a href="https://open.spotify.com/" target="_blank">
          Spotify
        </a>
        <img className={styles.spotifyLogo} src="/spotify_logo.png" alt="" />
      </p>
    </footer>
  );
}
