// Fundort-Daten fuer Spiele, die die PokeAPI nicht liefert (Gen 8/9).
// Die JSON liegt lokal (src/data/encounters/) und wird per dynamischem Import
// erst geladen, wenn wirklich ein solches Spiel im Detail geoeffnet wird -
// so bleibt sie aus dem Haupt-Bundle draussen.

const LOADERS = {
  swsh: () => import("../data/encounters/swsh.json"),
  // sv: () => import("../data/encounters/sv.json"),  // folgt spaeter (Gen 9)
};

const cache = {};

export function hasLocalEncounters(gameId) {
  return gameId in LOADERS;
}

// Liefert die Daten in genau der Form, die PokemonLocations erwartet:
//   encounters -> fuer buildEncounters()  ([{ location, versions }])
//   names      -> vorab aufgeloeste Anzeigenamen ({ [location]: { en, de } })
// Serebii liefert nur englische Ortsnamen -> de faellt auf en zurueck.
export async function fetchLocalEncounters(gameId, pokemonId) {
  if (!LOADERS[gameId]) return { encounters: [], names: {} };

  if (!cache[gameId]) {
    cache[gameId] = LOADERS[gameId]().then((mod) => mod.default);
  }
  const data = await cache[gameId];
  const entry = data[String(pokemonId)] ?? [];

  const encounters = entry.map((loc) => ({
    location: loc.location,
    versions: loc.versions,
  }));
  const names = Object.fromEntries(
    entry.map((loc) => [loc.location, { en: loc.name, de: loc.name }]),
  );
  return { encounters, names };
}
