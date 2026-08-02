import { useState, useMemo, useCallback } from "react";
import { FilterContext } from "./filterContextObject";

// "number" = Pokédex-Reihenfolge = keine echte Sortierung -> Standardansicht.
const DEFAULT_SORT = { field: "number", dir: "asc" };

export function FilterProvider({ children }) {
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [types, setTypes] = useState([]);

  const setSortField = useCallback((field) => {
    setSort((prev) => ({ ...prev, field }));
  }, []);

  const setSortDir = useCallback((dir) => {
    setSort((prev) => ({ ...prev, dir }));
  }, []);

  const toggleType = useCallback((type) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  const reset = useCallback(() => {
    setSort(DEFAULT_SORT);
    setTypes([]);
  }, []);

  // Aktiv, sobald sortiert oder mindestens ein Typ gewählt ist.
  const isActive = sort.field !== "number" || types.length > 0;

  const value = useMemo(
    () => ({
      sort,
      setSortField,
      setSortDir,
      types,
      toggleType,
      reset,
      isActive,
    }),
    [sort, setSortField, setSortDir, types, toggleType, reset, isActive],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
