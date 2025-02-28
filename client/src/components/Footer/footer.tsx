import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.attributions}>
        <p className={styles.footerInfo}>
          <img
            className={styles.logo}
            src="/github_logo.png"
            alt="GitHub logo"
          />
          Built by{" "}
          <a href="https://github.com/emoore29/cadence" target="_blank">
            Emma Moore
          </a>
        </p>
        <p className={styles.footerInfo}>
          <img
            className={styles.logo}
            src="/spotify_logo.png"
            alt="Spotify logo"
          />
          Metadata provided by{" "}
          <a href="https://open.spotify.com/" target="_blank">
            Spotify
          </a>
        </p>
        <p className={styles.footerInfo}>
          <img
            className={styles.logo}
            src="/acousticbrainz_logo.png"
            alt="AcousticBrainz logo"
          />
          Features provided by{" "}
          <a href="https://acousticbrainz.org/" target="_blank">
            AcousticBrainz
          </a>
        </p>
        <p className={styles.footerInfo}>
          <img
            className={styles.logo}
            src="/deezer_logo.png"
            alt="Deezer logo"
          />
          Previews provided by <a href="">Deezer</a>
        </p>
      </div>
    </footer>
  );
}
