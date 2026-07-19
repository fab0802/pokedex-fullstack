import { useContext } from "react";
import { PokemonListContext } from "./pokemonListContextObject";

export function usePokemonList() {
  return useContext(PokemonListContext);
}
