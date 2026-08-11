import { useState, useEffect } from "react";
import { BallThemeContext } from "./ballThemeContextObject";
import { useAuth } from "./useAuth";
import { getSettings, updateSettings } from "../services/settingsApi";

// Gueltige Ball-Designs; "poke" ist der Standard (klassisches Rot).
const BALLS = ["poke", "great", "ultra", "master"];

export function BallThemeProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [ball, setBallState] = useState(() => {
    const saved = localStorage.getItem("ball");
    return BALLS.includes(saved) ? saved : "poke";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-ball", ball);
  }, [ball]);

  // Beim Login die serverseitig gespeicherte Einstellung laden (Backend gewinnt).
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    getSettings()
      .then((s) => {
        if (active && BALLS.includes(s?.ball)) {
          localStorage.setItem("ball", s.ball);
          setBallState(s.ball);
        }
      })
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  function setBall(newBall) {
    if (!BALLS.includes(newBall)) return;
    localStorage.setItem("ball", newBall); // Gast-Fallback
    setBallState(newBall);
    // Eingeloggt zusaetzlich serverseitig speichern (fire-and-forget).
    if (isAuthenticated) {
      updateSettings({ ball: newBall }).catch((err) => console.error(err));
    }
  }

  return (
    <BallThemeContext.Provider value={{ ball, setBall }}>
      {children}
    </BallThemeContext.Provider>
  );
}
