import { useState, useEffect, useCallback, useMemo } from "react";
import { CollectionContext } from "./collectionContextObject";
import { useAuth } from "./useAuth";
import { useGame } from "./useGame";
import { getCollection, setCaught } from "../services/collectionApi";

// Stabiles leeres Set als Fallback, damit useMemo/useCallback nicht bei jedem
// Render eine neue Referenz bekommen (wichtig fuer den Fangstatus-Filter).
const EMPTY_SET = new Set();

export function CollectionProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { selectedGame } = useGame();

  // Fangstatus gruppiert nach Spiel: { [gameId]: Set<pokemonId> }.
  // Nur gefangene Pokemon sind enthalten.
  const [caughtByGame, setCaughtByGame] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      setCaughtByGame({});
      return;
    }
    getCollection()
      .then((entries) => {
        const map = {};
        for (const e of entries) {
          if (!e.caught) continue;
          const g = e.game || "all";
          if (!map[g]) map[g] = new Set();
          map[g].add(e.pokemonId);
        }
        setCaughtByGame(map);
      })
      .catch((err) => console.error(err));
  }, [isAuthenticated]);

  // Gefangene IDs des aktuell gewaehlten Spiels.
  const caughtIds = useMemo(
    () => caughtByGame[selectedGame.id] || EMPTY_SET,
    [caughtByGame, selectedGame.id],
  );

  // Stabil an caughtIds gebunden: so laesst sich isCaught als Memo-Dependency
  // (z. B. im Fangstatus-Filter) nutzen, ohne bei jedem Render neu zu sein.
  const isCaught = useCallback(
    (pokemonId) => caughtIds.has(Number(pokemonId)),
    [caughtIds],
  );

  const toggleCaught = useCallback(
    async (pokemonId) => {
      const id = Number(pokemonId);
      const gameId = selectedGame.id;
      const current = caughtByGame[gameId] || EMPTY_SET;
      const newCaught = !current.has(id);
      try {
        await setCaught(id, newCaught, gameId);
        setCaughtByGame((prev) => {
          const nextSet = new Set(prev[gameId] || []);
          if (newCaught) nextSet.add(id);
          else nextSet.delete(id);
          return { ...prev, [gameId]: nextSet };
        });
      } catch (err) {
        console.error(err);
      }
    },
    [caughtByGame, selectedGame.id],
  );

  // Anzahl gefangener Pokemon im aktuellen Spiel (Basis fuer eine spaetere
  // Anzeige in der Menueleiste).
  const caughtCount = caughtIds.size;

  const value = useMemo(
    () => ({ isCaught, toggleCaught, caughtCount }),
    [isCaught, toggleCaught, caughtCount],
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}
