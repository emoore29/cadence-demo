import { IconSearch } from "@tabler/icons-react";
import styles from "./welcome.module.css";

export default function Welcome() {
  return (
    <div className={styles.welcome}>
      <h1>Welcome!</h1>
      <p>Use the filters to search for your preferred tracks.</p>
      <IconSearch className={styles.searchIcon} stroke={2} size={300} />
    </div>
  );
}
