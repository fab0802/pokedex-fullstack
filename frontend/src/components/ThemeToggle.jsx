import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../context/useTheme";
import styles from "./ThemeToggle.module.css";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.group}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          className={`${styles.button} ${theme === value ? styles.active : ""}`}
          onClick={() => setTheme(value)}
          title={label}
          aria-label={label}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
