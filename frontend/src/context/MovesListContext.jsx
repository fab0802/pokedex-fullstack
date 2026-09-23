import { useMemo, useRef, useState } from "react";
import {
  MovesListContext,
  DEFAULT_MOVE_FILTERS,
} from "./movesListContextObject";

// Hält Filter und Sortierung der Attackenliste. Liegt ausserhalb der Seite,
// damit beides das Unmounten beim Öffnen einer Detailseite überlebt – und
// damit die Detailseite dieselbe Reihenfolge fürs Swipen kennt.
export function MovesListProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_MOVE_FILTERS);
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  // Zuletzt angesehene Attacke: Anker für die Scroll-Position der Liste
  // (gleiches Prinzip wie lastVisitedIdRef im PokemonListContext).
  const lastVisitedSlugRef = useRef(null);

  const value = useMemo(
    () => ({ filters, setFilters, sort, setSort, lastVisitedSlugRef }),
    [filters, sort],
  );

  return (
    <MovesListContext.Provider value={value}>
      {children}
    </MovesListContext.Provider>
  );
}
