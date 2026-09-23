import { createContext } from "react";

export const MovesListContext = createContext(null);

// Startwerte der Attacken-Filter. Hier statt im Provider, weil eine
// Komponenten-Datei für Fast Refresh nur Komponenten exportieren sollte.
export const DEFAULT_MOVE_FILTERS = {
  query: "",
  type: "",
  category: "",
  onlyTm: false,
};
