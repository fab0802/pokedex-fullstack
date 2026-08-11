import { useState, useEffect } from "react";
import { ThemeContext } from "./themeContextObject";
import { useAuth } from "./useAuth";
import { getSettings, updateSettings } from "../services/settingsApi";

export function ThemeProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // "system" | "light" | "dark". Start aus localStorage: dient als Gast-Fallback
  // und verhindert ein kurzes Aufblitzen des falschen Themes beim Reload.
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("theme") || "system",
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const effective =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.setAttribute("data-theme", effective);
    }

    applyTheme();

    // Bei "system" auf OS-Wechsel live reagieren
    if (theme === "system") {
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  // Beim Login die serverseitig gespeicherte Einstellung laden (Backend gewinnt).
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    getSettings()
      .then((s) => {
        if (active && s?.theme) {
          localStorage.setItem("theme", s.theme);
          setThemeState(s.theme);
        }
      })
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  function setTheme(newTheme) {
    localStorage.setItem("theme", newTheme); // Gast-Fallback + Anti-Flash
    setThemeState(newTheme);
    // Eingeloggt zusaetzlich serverseitig speichern (fire-and-forget).
    if (isAuthenticated) {
      updateSettings({ theme: newTheme }).catch((err) => console.error(err));
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
