// Erzeugt src/data/pokemonNames.json aus der PokeAPI.
// Einmalig ausfuehren mit:  npm run generate:names
//
// Warum ein Skript und keine Abfrage zur Laufzeit: die REST-API liefert
// lokalisierte Namen nur einzeln pro Pokemon (1025 Requests). GraphQL kann
// alles in einer Abfrage - laeuft aber auf einer kleinen Gratis-Instanz mit
// 100 Aufrufen pro Stunde. Einmal holen und mitliefern ist beides zusammen.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINT = "https://graphql.pokeapi.co/v1beta2";
const GERMAN_LANGUAGE_ID = 6;
const MAX_ID = 1025;

const OUT_FILE = fileURLToPath(
  new URL("../src/data/pokemonNames.json", import.meta.url),
);

const QUERY = `
  query germanNames($maxId: Int!, $languageId: Int!) {
    pokemonspecies(where: { id: { _lte: $maxId } }, order_by: { id: asc }) {
      id
      name
      pokemonspeciesnames(where: { language_id: { _eq: $languageId } }) {
        name
      }
    }
  }
`;

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    query: QUERY,
    variables: { maxId: MAX_ID, languageId: GERMAN_LANGUAGE_ID },
  }),
});

if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`);
  process.exit(1);
}

const payload = await res.json();

// GraphQL antwortet auch bei Feldfehlern mit HTTP 200 - die Meldung steckt
// in payload.errors. Deshalb hier explizit pruefen.
if (payload.errors) {
  console.error("GraphQL-Fehler:");
  payload.errors.forEach((e) => console.error(" -", e.message));
  console.error(
    "\nFeldnamen im Explorer pruefen: https://graphql.pokeapi.co/v1beta2/console/",
  );
  process.exit(1);
}

const list = payload.data.pokemonspecies.map((s) => ({
  id: s.id,
  name: s.name,
  nameDe: s.pokemonspeciesnames[0]?.name ?? s.name,
}));

const missing = list.filter((p) => p.nameDe === p.name).length;

await mkdir(dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, JSON.stringify(list, null, 0) + "\n", "utf8");

console.log(`${list.length} Namen geschrieben nach ${OUT_FILE}`);
if (missing > 0) {
  console.log(`Hinweis: ${missing} ohne deutschen Namen (Fallback Englisch)`);
}
