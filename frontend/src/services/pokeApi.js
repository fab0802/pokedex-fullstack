const BASE_URL = "https://pokeapi.co/api/v2";
const CACHE_KEY = "pokemon-cache-v4";
const EVO_CACHE_KEY = "pokemon-evolution-v1";
const NAME_CACHE_KEY = "pokeapi-names-v1";
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

  const [pRes, sRes] = await Promise.all([
    fetch(`${BASE_URL}/pokemon/${id}`),
    fetch(`${BASE_URL}/pokemon-species/${id}`),
  ]);
  if (!pRes.ok) throw new Error("Failed to load Pokémon");
  const p = await pRes.json();

  let nameDe = p.name;
  let evolutionChainUrl = null;
  if (sRes.ok) {
    const s = await sRes.json();
    const deEntry = s.names.find((n) => n.language.name === "de");
    if (deEntry) nameDe = deEntry.name;
    evolutionChainUrl = s.evolution_chain?.url ?? null;
  }

  const result = {
    id: p.id,
    name: p.name,
    nameDe,
    image:
      p.sprites.other["official-artwork"].front_default ??
      p.sprites.front_default,
    types: p.types.map((t) => t.type.name),
    evolutionChainUrl,
    height: p.height,
    weight: p.weight,
    stats: p.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
  };
  setCacheEntry(id, result);
  return result;
}

// --- Evolution ---------------------------------------------------------

function idFromUrl(url) {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}

// Wandelt einen Knoten der API-Kette in unsere eigene, schlanke Form um.
// Ruft sich fuer jeden Nachfolger selbst auf -> der ganze Baum entsteht.
function buildNode(link) {
  return {
    id: idFromUrl(link.species.url),
    details: link.evolution_details ?? [],
    next: link.evolves_to.map(buildNode),
  };
}

export async function fetchEvolutionChain(chainUrl) {
  if (!chainUrl) return null;

  const chainId = idFromUrl(chainUrl);
  const cache = JSON.parse(localStorage.getItem(EVO_CACHE_KEY) || "{}");
  if (cache[chainId]) return cache[chainId];

  const res = await fetch(chainUrl);
  if (!res.ok) throw new Error("Failed to load evolution chain");
  const data = await res.json();

  const root = buildNode(data.chain);
  cache[chainId] = root;
  localStorage.setItem(EVO_CACHE_KEY, JSON.stringify(cache));
  return root;
}

// Holt die lokalisierten Namen einer benannten Ressource (item, location,
// move). Cache-Schluessel ist "art:slug", z.B. "item:fire-stone" - anders
// als beim Pokemon-Cache, wo die ID reicht.
export async function fetchLocalizedNames(kind, slug) {
  const key = `${kind}:${slug}`;
  const cache = JSON.parse(localStorage.getItem(NAME_CACHE_KEY) || "{}");
  if (cache[key]) return cache[key];

  const res = await fetch(`${BASE_URL}/${kind}/${slug}`);
  if (!res.ok) throw new Error("Failed to load names");
  const data = await res.json();

  const pick = (lang) => data.names.find((n) => n.language.name === lang)?.name;
  const entry = { de: pick("de") ?? null, en: pick("en") ?? null };

  cache[key] = entry;
  localStorage.setItem(NAME_CACHE_KEY, JSON.stringify(cache));
  return entry;
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

// --- Typ-Effektivität (Verteidigung) -----------------------------------

const TYPE_CACHE_KEY = "pokeapi-types-v1";

const ALL_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];
// Anzeige-Reihenfolge der Zeilen: von immun (×0) bis vierfach (×4)
const FACTOR_ORDER = [0, 0.25, 0.5, 1, 2, 4];

// Wie viel Schaden nimmt dieses Pokémon von jedem angreifenden Typ? Die
// API liefert das nur pro Typ (/type/{name}); bei Doppel-Typen müssen wir
// die Multiplikatoren über beide eigenen Typen kombinieren. Rückgabe:
// nach Multiplikator gruppierte Zeilen, leere Zeilen fallen raus.
export async function fetchTypeEffectiveness(types) {
  const cache = JSON.parse(localStorage.getItem(TYPE_CACHE_KEY) || "{}");

  const relations = await Promise.all(
    types.map(async (name) => {
      if (cache[name]) return cache[name];
      const res = await fetch(`${BASE_URL}/type/${name}`);
      if (!res.ok) throw new Error("Failed to load type");
      const data = await res.json();
      const rel = {
        double: data.damage_relations.double_damage_from.map((x) => x.name),
        half: data.damage_relations.half_damage_from.map((x) => x.name),
        no: data.damage_relations.no_damage_from.map((x) => x.name),
      };
      cache[name] = rel;
      return rel;
    }),
  );
  localStorage.setItem(TYPE_CACHE_KEY, JSON.stringify(cache));

  // Jeder Typ startet neutral (1), dann mit den eigenen Typen verrechnen
  const factors = {};
  for (const type of ALL_TYPES) factors[type] = 1;
  for (const rel of relations) {
    for (const atk of rel.double) factors[atk] *= 2;
    for (const atk of rel.half) factors[atk] *= 0.5;
    for (const atk of rel.no) factors[atk] *= 0;
  }

  return FACTOR_ORDER.map((factor) => ({
    factor,
    types: ALL_TYPES.filter((type) => factors[type] === factor),
  })).filter((group) => group.types.length > 0);
}

// --- Moves -------------------------------------------------------------

const MOVES_CACHE_KEY = "pokemon-moves-v1";

// Rohe Move-Liste eines Pokémon: pro Move die Lern-Details je Spiel-Version.
// Gruppieren/Filtern nach Version passiert erst in der Komponente.
export async function fetchPokemonMoves(id) {
  const cache = JSON.parse(localStorage.getItem(MOVES_CACHE_KEY) || "{}");
  if (cache[id]) return cache[id];

  const res = await fetch(`${BASE_URL}/pokemon/${id}`);
  if (!res.ok) throw new Error("Failed to load moves");
  const data = await res.json();

  const moves = data.moves.map((m) => ({
    slug: m.move.name,
    details: m.version_group_details.map((d) => ({
      level: d.level_learned_at,
      method: d.move_learn_method.name,
      versionGroup: d.version_group.name,
    })),
  }));

  cache[id] = moves;
  localStorage.setItem(MOVES_CACHE_KEY, JSON.stringify(cache));
  return moves;
}
