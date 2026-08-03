import { useState, useMemo, useCallback } from "react";
import { DisplayContext } from "./displayContextObject";

// Standard-Stat in der Listenansicht. Unabhängig von der Sortierung.
const DEFAULT_STAT = "total";

export function DisplayProvider({ children }) {
  const [statField, setStatFieldState] = useState(
    () => localStorage.getItem("displayStat") || DEFAULT_STAT,
  );

  const setStatField = useCallback((field) => {
    localStorage.setItem("displayStat", field);
    setStatFieldState(field);
  }, []);

  const value = useMemo(
    () => ({ statField, setStatField }),
    [statField, setStatField],
  );

  return (
    <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
  );
}
