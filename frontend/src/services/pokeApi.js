const BASE_URL = "https://pokeapi.co/api/v2";
const CACHE_KEY = "pokemon-cache-v2";
const NATIONAL_MAX = 1025;

function getCache() {
  return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
}

function setCacheEntry(id, data) {
  const cache = getCache();
  cache[id] = data;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export async function fetchPokemonById(id) {
  const cache = getCache();
  if (cache[id]) return cache[id];

  const res = await fetch(`${BASE_URL}/pokemon/${id}`);
  if (!res.ok) throw new Error("Failed to load Pokémon");
  const p = await res.json();
  const result = {
    id: p.id,
    name: p.name,
    image:
      p.sprites.other["official-artwork"].front_default ??
      p.sprites.front_default,
    types: p.types.map((t) => t.type.name),
    height: p.height,
    weight: p.weight,
    stats: p.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
  };
  setCacheEntry(id, result);
  return result;
}

export async function fetchPokedexIds(dexes) {
  // null = kompletter National-Dex (alle Pokémon)
  if (!dexes) {
    return Array.from({ length: NATIONAL_MAX }, (_, i) => i + 1);
  }
  const lists = await Promise.all(
    dexes.map(async (name) => {
      const res = await fetch(`${BASE_URL}/pokedex/${name}`);
      if (!res.ok) throw new Error("Failed to load Pokédex");
      const data = await res.json();
      return data.pokemon_entries.map((entry) => {
        const parts = entry.pokemon_species.url.split("/").filter(Boolean);
        return Number(parts[parts.length - 1]);
      });
    }),
  );
  // Mehrere Dexe zusammenführen, Duplikate raus, sortieren
  return [...new Set(lists.flat())]
    .filter((id) => id <= NATIONAL_MAX)
    .sort((a, b) => a - b);
}

let allNamesCache = null;

export async function fetchAllPokemonNames() {
  if (allNamesCache) return allNamesCache;

  const stored = localStorage.getItem("pokemon-names");
  if (stored) {
    allNamesCache = JSON.parse(stored);
    return allNamesCache;
  }

  const res = await fetch(`${BASE_URL}/pokemon?limit=100000&offset=0`);
  if (!res.ok) throw new Error("Failed to load Pokémon names");
  const data = await res.json();
  const list = data.results
    .map((p) => {
      const parts = p.url.split("/").filter(Boolean);
      return { id: Number(parts[parts.length - 1]), name: p.name };
    })
    .filter((p) => p.id <= 1025)
    .sort((a, b) => a.id - b.id);

  allNamesCache = list;
  localStorage.setItem("pokemon-names", JSON.stringify(list));
  return list;
}
