// Einmalig ausführen:  node scripts/generate-move-names.mjs
// Holt alle Move-Namen (EN/DE) via PokéAPI-GraphQL (v1beta2) und schreibt
// sie nach frontend/src/data/moveNames.json – Lookup nach Slug.
import { writeFile } from "node:fs/promises";

const ENDPOINT = "https://graphql.pokeapi.co/v1beta2";

// language_id 6 = Deutsch, 9 = Englisch
const query = `
  query MoveNames {
    move(order_by: { id: asc }) {
      name
      de: movenames(where: { language_id: { _eq: 6 } }) { name }
      en: movenames(where: { language_id: { _eq: 9 } }) { name }
    }
  }
`;

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const json = await res.json();
if (json.errors) {
  console.error(JSON.stringify(json.errors, null, 2));
  process.exit(1);
}

const result = {};
for (const move of json.data.move) {
  result[move.name] = {
    en: move.en[0]?.name ?? null,
    de: move.de[0]?.name ?? null,
  };
}

await writeFile(
  new URL("../src/data/moveNames.json", import.meta.url),
  JSON.stringify(result),
);

console.log(`Wrote ${Object.keys(result).length} moves.`);
