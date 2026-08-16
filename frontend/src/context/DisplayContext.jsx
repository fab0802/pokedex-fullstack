import { useState, useMemo, useCallback, useEffect } from "react";
import { DisplayContext } from "./displayContextObject";
import { useAuth } from "./useAuth";
import { getSettings, updateSettings } from "../services/settingsApi";

// Standard-Stat in der Listenansicht. Unabhaengig von der Sortierung.
const DEFAULT_STAT = "total";
// Standard-Ansicht: klassische Zeilen-Liste (Variante A).
const DEFAULT_LAYOUT = "list";

export function DisplayProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [statField, setStatFieldState] = useState(
    () => localStorage.getItem("displayStat") || DEFAULT_STAT,
  );

  const [layout, setLayoutState] = useState(
    () => localStorage.getItem("layout") || DEFAULT_LAYOUT,
  );

  // Beim Login die serverseitig gespeicherten Einstellungen laden (Backend gewinnt).
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    getSettings()
      .then((s) => {
        if (!active || !s) return;
        if (s.displayStat) {
          localStorage.setItem("displayStat", s.displayStat);
          setStatFieldState(s.displayStat);
        }
        if (s.layout) {
          localStorage.setItem("layout", s.layout);
          setLayoutState(s.layout);
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

  const setLayout = useCallback(
    (next) => {
      localStorage.setItem("layout", next); // Gast-Fallback
      setLayoutState(next);
      if (isAuthenticated) {
        updateSettings({ layout: next }).catch((err) => console.error(err));
      }
    },
    [isAuthenticated],
  );

  const value = useMemo(
    () => ({ statField, setStatField, layout, setLayout }),
    [statField, setStatField, layout, setLayout],
  );

  return (
    <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
  );
}
