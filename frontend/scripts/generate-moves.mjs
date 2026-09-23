// Einmalig ausführen:  node scripts/generate-moves.mjs
// Erzeugt frontend/src/data/moves.json für den Attacken Guide:
//   moves:          aktuelle Werte je Attacke (Stärke, Genauigkeit, AP, Klasse, Priorität)
//   byVersionGroup: je Spiel alle verfügbaren Attacken, inkl. TM-Nummer und
//                   Abweichungen von den aktuellen Werten (nur Diffs, hält die Datei klein)
// Namen und aktueller Typ kommen weiterhin aus moveNames.json.
import { writeFile } from "node:fs/promises";
import { games } from "../src/components/games.js";

const ENDPOINT = "https://graphql.pokeapi.co/v1beta2";

// Bis Gen 3 hing physisch/speziell am Typ, nicht an der Attacke.
const PHYSICAL_TYPES_GEN1_3 = new Set([
  "normal", "fighting", "flying", "poison", "ground",
  "rock", "bug", "ghost", "steel",
]);

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  return json.data;
}

// Nur Version-Groups, die wir in games.js tatsächlich anbieten
const VGS = games.flatMap((g) => g.versionGroups);

// 1) Version-Groups mit Reihenfolge + Generation
const { versiongroup } = await gql(
  `query ($vgs: [String!]) {
    versiongroup(where: { name: { _in: $vgs } }) { name order generation_id }
  }`,
  { vgs: VGS },
);
const vgInfo = Object.fromEntries(
  versiongroup.map((v) => [v.name, { order: v.order, gen: v.generation_id }]),
);

// Reihenfolge ALLER Version-Groups (auch solche ausserhalb von games.js),
// weil movechanges sich auf jede Version-Group beziehen kann.
const { versiongroup: allVgs } = await gql(
  `{ versiongroup { name order } }`,
);
const vgOrder = Object.fromEntries(allVgs.map((v) => [v.name, v.order]));

// 2) Alle Attacken mit aktuellen Werten + historischen Änderungen
const { move } = await gql(`{
  move(order_by: { id: asc }) {
    name power accuracy pp priority
    movedamageclass { name }
    type { name }
    movechanges { power accuracy pp type { name } versiongroup { name } }
  }
}`);

// 3) TM/VM/TR-Zuordnung je Version-Group
const { machine } = await gql(
  `query ($vgs: [String!]) {
    machine(where: { versiongroup: { name: { _in: $vgs } } }) {
      item { name } move { name } versiongroup { name }
    }
  }`,
  { vgs: VGS },
);
const machineByVg = {};
for (const m of machine) {
  const vg = m.versiongroup.name;
  machineByVg[vg] ??= {};
  machineByVg[vg][m.move.name] ??= m.item.name; // erster Treffer reicht
}

// Werte einer Attacke für eine bestimmte Version-Group auflösen.
// movechange = "so war es VOR dieser Version-Group". Von neu nach alt
// durchgehen und überschreiben, solange das Ziel-Spiel älter ist.
function resolve(mv, vg) {
  const out = {
    power: mv.power,
    accuracy: mv.accuracy,
    pp: mv.pp,
    type: mv.type?.name ?? null,
  };
  const changes = [...mv.movechanges].sort(
    (a, b) => vgOrder[b.versiongroup.name] - vgOrder[a.versiongroup.name],
  );
  for (const c of changes) {
    if (vgOrder[vg] >= vgOrder[c.versiongroup.name]) continue;
    if (c.power != null) out.power = c.power;
    if (c.accuracy != null) out.accuracy = c.accuracy;
    if (c.pp != null) out.pp = c.pp;
    if (c.type?.name) out.type = c.type.name;
  }
  return out;
}

// Die PokéAPI speichert "kein Wert" uneinheitlich: meist null, bei einigen
// neueren Attacken aber 0 (z. B. Status-Attacken aus K/P). Eine echte Stärke
// oder Genauigkeit von 0 gibt es nicht -> einheitlich null.
const clean = (v) => (v === 0 ? null : v);
for (const mv of move) {
  mv.power = clean(mv.power);
  mv.accuracy = clean(mv.accuracy);
  for (const c of mv.movechanges) {
    c.power = clean(c.power);
    c.accuracy = clean(c.accuracy);
  }
}

const moves = {};
const moveBySlug = {};
for (const mv of move) {
  moveBySlug[mv.name] = mv;
  moves[mv.name] = {
    power: mv.power,
    accuracy: mv.accuracy,
    pp: mv.pp,
    class: mv.movedamageclass?.name ?? null,
    priority: mv.priority,
  };
}

// 4) Je Version-Group: welche Attacken sind lernbar? (distinct = jede Attacke 1x)
const byVersionGroup = {};
for (const vg of VGS) {
  const { pokemonmove } = await gql(
    `query ($vg: String!) {
      pokemonmove(
        where: { versiongroup: { name: { _eq: $vg } } }
        distinct_on: move_id
      ) { move { name } }
    }`,
    { vg },
  );

  const entries = {};
  for (const { move: m } of pokemonmove) {
    const mv = moveBySlug[m.name];
    if (!mv) continue;
    const base = moves[m.name];
    const past = resolve(mv, vg);
    const entry = {};

    const tm = machineByVg[vg]?.[m.name];
    if (tm) entry.tm = tm;

    // Nur speichern, was vom aktuellen Wert abweicht
    if (past.power !== base.power) entry.power = past.power;
    if (past.accuracy !== base.accuracy) entry.accuracy = past.accuracy;
    if (past.pp !== base.pp) entry.pp = past.pp;
    if (past.type !== mv.type?.name) entry.type = past.type;

    // Gen 1–3: Klasse aus dem (damaligen) Typ ableiten, Status bleibt Status
    if (vgInfo[vg].gen <= 3 && base.class !== "status") {
      const cls = PHYSICAL_TYPES_GEN1_3.has(past.type) ? "physical" : "special";
      if (cls !== base.class) entry.class = cls;
    }

    entries[m.name] = entry;
  }
  byVersionGroup[vg] = entries;
  console.log(`${vg}: ${Object.keys(entries).length} moves`);
}

await writeFile(
  new URL("../src/data/moves.json", import.meta.url),
  JSON.stringify({ moves, byVersionGroup }),
);

console.log(`Wrote ${Object.keys(moves).length} moves.`);
