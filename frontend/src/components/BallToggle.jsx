import { useBallTheme } from "../context/useBallTheme";
import { useTranslation } from "react-i18next";
import styles from "./BallToggle.module.css";

// Charakteristische Oberfarbe je Ball; die untere Hälfte bleibt weiss.
const OPTIONS = [
  { value: "poke", color: "#c0392b" },
  { value: "great", color: "#2f6fb3" },
  { value: "ultra", color: "#c98a00" },
  { value: "master", color: "#7a4fa3" },
];

function BallIcon({ color, size }) {
  return (
    <svg
      className={styles.icon}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="#fff" />
      <path d="M1 12 A11 11 0 0 1 23 12 Z" fill={color} />
      <line x1="1" y1="12" x2="23" y2="12" stroke="#1c1917" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="#fff" stroke="#1c1917" strokeWidth="2" />
      <circle cx="12" cy="12" r="11" fill="none" stroke="#1c1917" strokeWidth="1.5" />
    </svg>
  );
}

export default function BallToggle({ variant }) {
  const { ball, setBall } = useBallTheme();
  const { t } = useTranslation();
  const isMenu = variant === "menu";

  return (
    <div
      className={`${styles.group} ${isMenu ? styles.groupMenu : ""}`}
      role="group"
      aria-label={t("ball.label")}
    >
      {OPTIONS.map(({ value, color }) => (
        <button
          key={value}
          className={`${styles.button} ${ball === value ? styles.active : ""}`}
          onClick={() => setBall(value)}
          title={t(`ball.${value}`)}
          aria-label={t(`ball.${value}`)}
          aria-pressed={ball === value}
        >
          <BallIcon color={color} size={isMenu ? 22 : 18} />
        </button>
      ))}
    </div>
  );
}
