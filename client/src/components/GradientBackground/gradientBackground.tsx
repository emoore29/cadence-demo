import React from "react";
import styles from "./gradientBackground.module.css";

interface GradientBackgroundProps {
  children: React.ReactNode;
}

export default function GradientBackground({
  children,
}: GradientBackgroundProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.background} />
      <div className={styles.childContainer}>{children}</div>
    </div>
  );
}
