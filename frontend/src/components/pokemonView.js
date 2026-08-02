import { comparePokemon } from "./sortPokemons";

// Typ-Filter (ODER): gibt es eine Auswahl, muss das Pokémon mindestens einen
// der gewählten Typen haben.
export function matchesFilters(p, { types }) {
  if (types && types.length) {
    if (!types.some((type) => p.types.includes(type))) return false;
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
