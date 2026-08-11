import { useState, useMemo, useCallback, useEffect } from "react";
import { DisplayContext } from "./displayContextObject";
import { useAuth } from "./useAuth";
import { getSettings, updateSettings } from "../services/settingsApi";

// Standard-Stat in der Listenansicht. Unabhaengig von der Sortierung.
const DEFAULT_STAT = "total";

export function DisplayProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [statField, setStatFieldState] = useState(
    () => localStorage.getItem("displayStat") || DEFAULT_STAT,
  );

  // Beim Login die serverseitig gespeicherte Einstellung laden (Backend gewinnt).
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    getSettings()
      .then((s) => {
        if (active && s?.displayStat) {
          localStorage.setItem("displayStat", s.displayStat);
          setStatFieldState(s.displayStat);
        }
      })
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const setStatField = useCallback(
    (field) => {
      localStorage.setItem("displayStat", field); // Gast-Fallback
      setStatFieldState(field);
      // Eingeloggt zusaetzlich serverseitig speichern (fire-and-forget).
      if (isAuthenticated) {
        updateSettings({ displayStat: field }).catch((err) =>
          console.error(err),
        );
      }
    },
    [isAuthenticated],
  );

  const value = useMemo(
    () => ({ statField, setStatField }),
    [statField, setStatField],
  );

  return (
    <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
  );
}
