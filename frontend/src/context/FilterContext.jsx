import { useState, useMemo, useCallback } from "react";
import { FilterContext } from "./filterContextObject";

// "number" = Pokédex-Reihenfolge = keine echte Sortierung -> Standardansicht.
const DEFAULT_SORT = { field: "number", dir: "asc" };

export function FilterProvider({ children }) {
  const [sort, setSort] = useState(DEFAULT_SORT);

  const setSortField = useCallback((field) => {
    setSort((prev) => ({ ...prev, field }));
  }, []);

  const setSortDir = useCallback((dir) => {
    setSort((prev) => ({ ...prev, dir }));
  }, []);

  const reset = useCallback(() => setSort(DEFAULT_SORT), []);

  // Sobald hier Typ-/Stat-Filter dazukommen, wandern sie in dieses isActive.
  const isSortActive = sort.field !== "number";
  const isActive = isSortActive;

  const value = useMemo(
    () => ({ sort, setSortField, setSortDir, reset, isActive }),
    [sort, setSortField, setSortDir, reset, isActive],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
