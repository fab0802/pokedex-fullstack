import { useMemo } from "react";
import { useFilter } from "./useFilter";
import { usePokemonList } from "./usePokemonList";
import { useCollection } from "./useCollection";
import { derivePokemonView } from "../components/pokemonView";

// Die ID-Reihenfolge, die der User gerade sieht: gefiltert/sortiert (wenn aktiv
// UND der volle Datensatz geladen ist), sonst die Reihenfolge des aktiven
// Spiel-Dex. Liste und Detailseite lesen dieselbe Quelle.
export function useOrderedIds() {
  const { sort, types, generations, categories, stat, caughtStatus, isActive } =
    useFilter();
  const { ids, allPokemons } = usePokemonList();
  const { isCaught } = useCollection();

  return useMemo(() => {
    if (isActive && allPokemons.length) {
      return derivePokemonView(allPokemons, {
        types,
        generations,
        categories,
        stat,
        caughtStatus,
        isCaught,
        sort,
      }).map((p) => p.id);
    }
    return ids;
  }, [
    isActive,
    allPokemons,
    types,
    generations,
    categories,
    stat,
    caughtStatus,
    isCaught,
    sort,
    ids,
  ]);
}
