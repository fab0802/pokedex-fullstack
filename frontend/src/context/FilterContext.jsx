import { useState, useMemo, useCallback } from "react";
import { FilterContext } from "./filterContextObject";

// "number" = Pokédex-Reihenfolge = keine echte Sortierung -> Standardansicht.
const DEFAULT_SORT = { field: "number", dir: "asc" };
// field=null -> Basiswerte-Filter aus. min/max als Strings (leer = offene Grenze).
const DEFAULT_STAT = { field: null, min: "", max: "" };
// "all" | "caught" | "uncaught"
const DEFAULT_CAUGHT = "all";

export function FilterProvider({ children }) {
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [types, setTypes] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [stat, setStat] = useState(DEFAULT_STAT);
  const [caughtStatus, setCaughtStatus] = useState(DEFAULT_CAUGHT);

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

  const toggleGeneration = useCallback((gen) => {
    setGenerations((prev) =>
      prev.includes(gen) ? prev.filter((g) => g !== gen) : [...prev, gen],
    );
  }, []);

  // Basiswert wählen; bei "" (Beliebig) den Filter samt Range zurücksetzen.
  const setStatField = useCallback((field) => {
    setStat((prev) =>
      field ? { ...prev, field } : { field: null, min: "", max: "" },
    );
  }, []);

  const setStatMin = useCallback((min) => {
    setStat((prev) => ({ ...prev, min }));
  }, []);

  const setStatMax = useCallback((max) => {
    setStat((prev) => ({ ...prev, max }));
  }, []);

  const reset = useCallback(() => {
    setSort(DEFAULT_SORT);
    setTypes([]);
    setGenerations([]);
    setStat(DEFAULT_STAT);
    setCaughtStatus(DEFAULT_CAUGHT);
  }, []);

  // Aktiv, sobald irgendein Filter oder eine Sortierung greift.
  const isActive =
    sort.field !== "number" ||
    types.length > 0 ||
    generations.length > 0 ||
    stat.field !== null ||
    caughtStatus !== "all";

  const value = useMemo(
    () => ({
      sort,
      setSortField,
      setSortDir,
      types,
      toggleType,
      generations,
      toggleGeneration,
      stat,
      setStatField,
      setStatMin,
      setStatMax,
      caughtStatus,
      setCaughtStatus,
      reset,
      isActive,
    }),
    [
      sort,
      setSortField,
      setSortDir,
      types,
      toggleType,
      generations,
      toggleGeneration,
      stat,
      setStatField,
      setStatMin,
      setStatMax,
      caughtStatus,
      reset,
      isActive,
    ],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
