import { comparePokemon, statValue } from "./sortPokemons";

// Generationen als ID-Bereiche (National-Dex). Index 0 = Gen 1 usw.
export const GEN_RANGES = [
  [1, 151],
  [152, 251],
  [252, 386],
  [387, 493],
  [494, 649],
  [650, 721],
  [722, 809],
  [810, 905],
  [906, 1025],
];

// Verfügbare Generationsnummern (1..9) für die UI.
export const GENERATIONS = GEN_RANGES.map((_, i) => i + 1);

function inGenerations(id, gens) {
  return gens.some((g) => {
    const range = GEN_RANGES[g - 1];
    return range && id >= range[0] && id <= range[1];
  });
}

// Alle Filterkriterien an einer Stelle (ODER innerhalb, UND zwischen Gruppen).
// Fehlende Felder = Kriterium inaktiv, damit Aufrufer ohne Collection (z. B. die
// Detail-Navigation) dieselbe Funktion nutzen können.
export function matchesFilters(
  p,
  { types, generations, categories, stat, caughtStatus, isCaught } = {},
) {
  // Typ (ODER): mindestens einer der gewählten Typen muss passen.
  if (types && types.length) {
    if (!types.some((type) => p.types.includes(type))) return false;
  }

  // Generation (ODER): ID muss in einem der gewählten Bereiche liegen.
  if (generations && generations.length) {
    if (!inGenerations(p.id, generations)) return false;
  }

  // Kategorie (ODER): legendär und/oder mystisch.
  if (categories && categories.length) {
    const ok = categories.some(
      (c) =>
        (c === "legendary" && p.isLegendary) ||
        (c === "mythical" && p.isMythical),
    );
    if (!ok) return false;
  }

  // Basiswert-Range: nur wenn ein Feld gewählt ist. Leere Grenze = offen.
  if (stat && stat.field) {
    const v = statValue(p, stat.field);
    const min = stat.min === "" || stat.min == null ? -Infinity : Number(stat.min);
    const max = stat.max === "" || stat.max == null ? Infinity : Number(stat.max);
    if (v < min || v > max) return false;
  }

  // Fangstatus: braucht isCaught; ohne (oder "all") wird nicht gefiltert.
  if (caughtStatus && caughtStatus !== "all" && typeof isCaught === "function") {
    const caught = isCaught(p.id);
    if (caughtStatus === "caught" && !caught) return false;
    if (caughtStatus === "uncaught" && caught) return false;
  }

  return true;
}

// Gemeinsame Ableitung für Liste UND Detail-Navigation: erst filtern, dann
// sortieren. Eine Quelle -> beide sehen dieselbe Reihenfolge.
export function derivePokemonView(pokemons, filters) {
  return pokemons
    .filter((p) => matchesFilters(p, filters))
    .sort(comparePokemon(filters.sort));
}
