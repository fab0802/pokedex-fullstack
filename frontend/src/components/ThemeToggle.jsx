import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../context/useTheme";
import styles from "./ThemeToggle.module.css";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export default function ThemeToggle({ variant }) {
  const { theme, setTheme } = useTheme();
  const isMenu = variant === "menu";

  return (
    <div className={`${styles.group} ${isMenu ? styles.groupMenu : ""}`}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          className={`${styles.button} ${theme === value ? styles.active : ""}`}
          onClick={() => setTheme(value)}
          title={label}
          aria-label={label}
        >
          <Icon size={isMenu ? 20 : 16} />
        </button>
      ))}
    </div>
  );
}
