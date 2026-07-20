export function pokemonName(pokemon, lang) {
  if (!pokemon) return "";
  return lang && lang.startsWith("de")
    ? (pokemon.nameDe ?? pokemon.name)
    : pokemon.name;
}
