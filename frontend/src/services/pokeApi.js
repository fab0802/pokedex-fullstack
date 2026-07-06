const BASE_URL = "https://pokeapi.co/api/v2";

export async function fetchPokemonList(limit = 20, offset = 0) {
  const res = await fetch(
    `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`,
  );
  if (!res.ok) throw new Error("Fehler beim Laden der Pokémon-Liste");
  return res.json(); // { count, next, previous, results: [{ name, url }] }
}
