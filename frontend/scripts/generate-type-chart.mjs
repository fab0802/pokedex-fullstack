// Einmalig ausführen:  node scripts/generate-type-chart.mjs
// Holt für alle 18 Typen die damage_relations via PokéAPI (REST) und baut daraus
// die Matrix chart[Angreifer][Verteidiger] = Multiplikator (nur Werte != 1).
// Schreibt nach frontend/src/data/typeChart.json.
import { writeFile } from "node:fs/promises";

const BASE_URL = "https://pokeapi.co/api/v2";

const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

const chart = {};

for (const type of TYPES) {
  const res = await fetch(`${BASE_URL}/type/${type}`);
  if (!res.ok) {
    console.error(`Fehler beim Laden von ${type}`);
    process.exit(1);
  }
  const { damage_relations: rel } = await res.json();
  const row = {};
  for (const x of rel.double_damage_to) row[x.name] = 2;
  for (const x of rel.half_damage_to) row[x.name] = 0.5;
  for (const x of rel.no_damage_to) row[x.name] = 0;
  chart[type] = row;
}

const out = { types: TYPES, chart };
await writeFile(
  new URL("../src/data/typeChart.json", import.meta.url),
  JSON.stringify(out, null, 2) + "\n",
);
console.log("typeChart.json geschrieben");
