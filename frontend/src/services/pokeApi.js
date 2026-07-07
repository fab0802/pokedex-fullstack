const BASE_URL = "https://pokeapi.co/api/v2";
const CACHE_KEY = "pokemon-cache";

function getCache() {
  return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
}

function setCacheEntry(id, data) {
  const cache = getCache();
  cache[id] = data;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export async function fetchPokemonList(limit = 20, offset = 0) {
  const res = await fetch(
    `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`,
  );
  if (!res.ok) throw new Error("Fehler beim Laden der Pokémon-Liste");
  const data = await res.json();

  const detailed = await Promise.all(
    data.results.map((p) => fetchPokemonDetail(p.url)),
  );

  return { ...data, results: detailed };
}

async function fetchPokemonDetail(url) {
  const id = url.split("/").filter(Boolean).pop();
  const cache = getCache();
  if (cache[id]) return cache[id]; // aus Cache, kein Request nötig

  const res = await fetch(url);
  if (!res.ok) throw new Error("Fehler beim Laden der Pokémon-Details");
  const p = await res.json();
  const result = {
    id: p.id,
    name: p.name,
    image:
      p.sprites.other["official-artwork"].front_default ??
      p.sprites.front_default,
    types: p.types.map((t) => t.type.name),
  };

  setCacheEntry(id, result);
  return result;
}

export async function fetchPokemonById(id) {
  const res = await fetch(`${BASE_URL}/pokemon/${id}`);
  if (!res.ok) throw new Error("Fehler beim Laden des Pokémon");
  const p = await res.json();
  return {
    id: p.id,
    name: p.name,
    image:
      p.sprites.other["official-artwork"].front_default ??
      p.sprites.front_default,
    types: p.types.map((t) => t.type.name),
    height: p.height, // in Dezimeter
    weight: p.weight, // in Hektogramm
    stats: p.stats.map((s) => ({
      name: s.stat.name, // z.B. "hp", "attack"
      value: s.base_stat,
    })),
  };
}
