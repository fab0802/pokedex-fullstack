import { useMemo } from "react";
import { useFilter } from "./useFilter";
import { usePokemonList } from "./usePokemonList";
import { comparePokemon } from "../components/sortPokemons";

// Die ID-Reihenfolge, die der User gerade sieht: sortiert (wenn aktiv UND der
// volle Datensatz geladen ist), sonst die Reihenfolge des aktiven Spiel-Dex.
// Liste und Detailseite lesen dieselbe Quelle -> Navigation bleibt konsistent.
export function useOrderedIds() {
  const { sort, isActive } = useFilter();
  const { ids, allPokemons } = usePokemonList();

  return useMemo(() => {
    if (isActive && allPokemons.length) {
      return [...allPokemons].sort(comparePokemon(sort)).map((p) => p.id);
    }
    return ids;
  }, [isActive, allPokemons, sort, ids]);
}
