import { useState, useEffect } from "react";
import { ThemeContext } from "./themeContextObject";

export function ThemeProvider({ children }) {
  // "system" | "light" | "dark"
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

  function setTheme(newTheme) {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
