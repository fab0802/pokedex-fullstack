import { useState, useEffect, useCallback, useMemo } from "react";
import { CollectionContext } from "./collectionContextObject";
import { useAuth } from "./useAuth";
import { getCollection, setCaught } from "../services/collectionApi";

export function CollectionProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [caughtIds, setCaughtIds] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setCaughtIds(new Set());
      return;
    }
    getCollection()
      .then((entries) => {
        const ids = entries.filter((e) => e.caught).map((e) => e.pokemonId);
        setCaughtIds(new Set(ids));
      })
      .catch((err) => console.error(err));
  }, [isAuthenticated]);

  // Stabil an caughtIds gebunden: so lässt sich isCaught als Memo-Dependency
  // (z. B. im Fangstatus-Filter) nutzen, ohne bei jedem Render neu zu sein.
  const isCaught = useCallback(
    (pokemonId) => caughtIds.has(Number(pokemonId)),
    [caughtIds],
  );

  const toggleCaught = useCallback(
    async (pokemonId) => {
      const id = Number(pokemonId);
      const newCaught = !caughtIds.has(id);
      try {
        await setCaught(id, newCaught);
        setCaughtIds((prev) => {
          const next = new Set(prev);
          if (newCaught) next.add(id);
          else next.delete(id);
          return next;
        });
      } catch (err) {
        console.error(err);
      }
    },
    [caughtIds],
  );

  const value = useMemo(
    () => ({ isCaught, toggleCaught }),
    [isCaught, toggleCaught],
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}
