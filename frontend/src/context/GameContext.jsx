import { useState, useEffect, useCallback, useMemo } from "react";
import { GameContext } from "./gameContextObject";
import { games } from "../components/games";
import { useAuth } from "./useAuth";
import { getSettings, updateSettings } from "../services/settingsApi";

// Persistiert wird nur die Spiel-ID (String). Diese Hilfsfunktion loest sie
// wieder zum vollstaendigen Spiel-Objekt auf; unbekannte/leere Werte fallen
// auf das erste Spiel ("all") zurueck.
function gameFromId(id) {
  return games.find((g) => g.id === id) || games[0];
}

export function GameProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // Gast-Fallback aus localStorage (analog zu Theme/Ball/Display).
  const [selectedGame, setSelectedGameState] = useState(() =>
    gameFromId(localStorage.getItem("game")),
  );

  // Beim Login die serverseitig gespeicherte Wahl laden (Backend gewinnt).
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    getSettings()
      .then((s) => {
        if (active && s?.game) {
          localStorage.setItem("game", s.game);
          setSelectedGameState(gameFromId(s.game));
        }
      })
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Nimmt weiterhin ein ganzes Spiel-Objekt entgegen (API bleibt unveraendert),
  // persistiert daraus aber nur die ID.
  const setSelectedGame = useCallback(
    (game) => {
      localStorage.setItem("game", game.id); // Gast-Fallback
      setSelectedGameState(game);
      // Eingeloggt zusaetzlich serverseitig speichern (fire-and-forget).
      if (isAuthenticated) {
        updateSettings({ game: game.id }).catch((err) => console.error(err));
      }
    },
    [isAuthenticated],
  );

  const value = useMemo(
    () => ({ selectedGame, setSelectedGame }),
    [selectedGame, setSelectedGame],
  );

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}
