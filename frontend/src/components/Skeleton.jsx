import styles from "./Skeleton.module.css";

// Wiederverwendbarer Platzhalter mit Shimmer-Effekt.
// width/height akzeptieren Zahlen (px) oder Strings ("40%").
export default function Skeleton({
  width,
  height,
  radius = 6,
  className = "",
}) {
  return (
    <span
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
