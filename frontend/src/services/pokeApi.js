const BASE_URL = "https://pokeapi.co/api/v2";

export async function fetchPokemonList(limit = 20, offset = 0) {
  const res = await fetch(
    `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`,
  );
  if (!res.ok) throw new Error("Fehler beim Laden der Pokémon-Liste");
  const data = await res.json();

  // Details (inkl. Typen, Bild) parallel für alle laden
  const detailed = await Promise.all(
    data.results.map((p) => fetchPokemonDetail(p.url)),
  );

  return { ...data, results: detailed };
}

async function fetchPokemonDetail(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fehler beim Laden der Pokémon-Details");
  const p = await res.json();
  return {
    id: p.id,
    name: p.name,
    image:
      p.sprites.other["official-artwork"].front_default ??
      p.sprites.front_default,
    types: p.types.map((t) => t.type.name),
  };
}
