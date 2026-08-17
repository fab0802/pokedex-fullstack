// Erzeugt src/data/encounters/swsh.json aus den Serebii-Fundortseiten.
// Einmalig ausfuehren:  npm run generate:swsh-encounters
//
// Warum ein Skript und keine Laufzeit-Abfrage: Die PokeAPI hat (Stand 2026)
// keine Fundort-Daten fuer Gen 8/9. Serebii listet sie pro Pokemon und Edition
// (Sword / Shield) inkl. Level-Spanne auf. Wir scrapen das einmalig und liefern
// die JSON mit - genau wie bei pokemonNames.json / moveNames.json.
//
// Ergebnis-Struktur (Lookup nach National-Dex-ID):
//   {
//     "831": [
//       { "location": "route1", "name": "Route 1",
//         "versions": [
//           { "version": "sword",  "min": 3, "max": 6 },
//           { "version": "shield", "min": 3, "max": 6 }
//         ] }
//     ]
//   }
// Diese Form passt direkt in buildEncounters() in PokemonLocations.jsx.
//
// Flags (alle optional):
//   --only 831,132   nur diese IDs (zum Testen)
//   --from 1 --to 898  ID-Bereich (Default 1..898 = SWSH-National-Dex-Ende)
//   --delay 500      ms Pause zwischen Requests (hoeflich bleiben)
//   --out <pfad>     Ziel-Datei ueberschreiben

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const BASE = "https://www.serebii.net";
const UA = "pokedex-fullstack portfolio scraper (one-time, respectful)";

const NAMES_FILE = new URL("../src/data/pokemonNames.json", import.meta.url);
const DEFAULT_OUT = fileURLToPath(
  new URL("../src/data/encounters/swsh.json", import.meta.url),
);

// --- CLI-Argumente ---------------------------------------------------------
function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const ONLY = arg("--only", null)
  ?.split(",")
  .map((n) => Number(n.trim()))
  .filter(Boolean);
const FROM = Number(arg("--from", 1));
const TO = Number(arg("--to", 898));
const DELAY = Number(arg("--delay", 500));
const OUT = arg("--out", DEFAULT_OUT);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Netzwerk ---------------------------------------------------------------
async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      return res;
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(1000 * attempt);
    }
  }
}

// Serebii-Slug ueber die numerische Seite aufloesen (leitet auf /name/ um).
// Deckt Sonderfaelle ab, bei denen der PokeAPI-Slug nicht passt
// (Farfetch'd, Mr. Mime, Nidoran-f, Type: Null, ...).
async function slugFromRedirect(id) {
  const res = await get(`${BASE}/pokedex-swsh/${id}.shtml`);
  if (!res || !res.ok) return null;
  const m = res.url.match(/\/pokedex-swsh\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

async function fetchLocationsHtml(slug) {
  const res = await get(`${BASE}/pokedex-swsh/${slug}/locations.shtml`);
  if (!res || !res.ok) return null;
  return res.text();
}

// --- Parsing ----------------------------------------------------------------
// Level-Zelle: "3 - 6", "13 - 15" oder einzeln "6". Gibt {min,max} oder null.
export function parseLevel(text) {
  const nums = (text.match(/\d+/g) || []).map(Number);
  if (nums.length === 0) return null;
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

function versionsFromHeader(text) {
  const hasSword = /sword/i.test(text);
  const hasShield = /shield/i.test(text);
  if (hasSword && hasShield) return ["sword", "shield"];
  if (hasSword) return ["sword"];
  if (hasShield) return ["shield"];
  return null;
}

// Aus dem HTML einer locations.shtml die wilden Fundorte extrahieren.
// Content-basiert (keine CSS-Klassen), damit kleine Layout-Aenderungen bei
// Serebii den Scraper nicht sofort brechen.
export function parseLocations(html) {
  const $ = load(html);

  // Aggregation: version -> slug -> { name, min, max }
  const acc = { sword: new Map(), shield: new Map() };

  $("table").each((_, table) => {
    const tableText = $(table).text();
    // Nur die eigentliche Fundort-Tabelle betrachten.
    if (!/Location/i.test(tableText) || !/Rarity/i.test(tableText)) return;

    let versions = null;
    $(table)
      .find("tr")
      .each((__, tr) => {
        const $tr = $(tr);
        const rowText = $tr.text().replace(/\s+/g, " ").trim();

        // Sektions-Kopf ("Pokémon Sword" / "Pokémon Shield")
        const cellCount = $tr.children("td,th").length;
        if (cellCount <= 2 && /pok.?mon\s+(sword|shield)/i.test(rowText)) {
          versions = versionsFromHeader(rowText);
          return;
        }
        if (!versions) return;

        // Spalten-Kopfzeile ueberspringen
        if (/^Location\b/i.test(rowText)) return;

        // Datenzeile: erster Link zeigt auf eine Pokearth-Location
        const locLink = $tr.find('a[href*="/pokearth/"]').first();
        if (locLink.length === 0) return;

        const name = locLink.text().replace(/\s+/g, " ").trim();
        const href = locLink.attr("href") || "";
        const slugMatch = href.match(/\/pokearth\/[^/]+\/([^/]+)\.shtml/i);
        const slug = slugMatch
          ? decodeURIComponent(slugMatch[1])
          : name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (!name) return;

        // Level = letzte Zelle, die wie ein Level aussieht.
        const cells = $tr
          .children("td")
          .map((___, td) => $(td).text().replace(/\s+/g, " ").trim())
          .get();
        let level = null;
        for (let i = cells.length - 1; i >= 0; i--) {
          if (/^\d+(\s*-\s*\d+)?$/.test(cells[i])) {
            level = parseLevel(cells[i]);
            break;
          }
        }
        if (!level) return;

        for (const v of versions) {
          const map = acc[v];
          const prev = map.get(slug);
          if (prev) {
            prev.min = Math.min(prev.min, level.min);
            prev.max = Math.max(prev.max, level.max);
          } else {
            map.set(slug, { name, min: level.min, max: level.max });
          }
        }
      });
  });

  // In die Ziel-Struktur zusammenfuehren (pro Location die Versionen buendeln).
  const byLocation = new Map(); // slug -> { location, name, versions: [] }
  for (const version of ["sword", "shield"]) {
    for (const [slug, data] of acc[version]) {
      let entry = byLocation.get(slug);
      if (!entry) {
        entry = { location: slug, name: data.name, versions: [] };
        byLocation.set(slug, entry);
      }
      entry.versions.push({ version, min: data.min, max: data.max });
    }
  }

  const locations = [...byLocation.values()];
  locations.sort(
    (a, b) =>
      Math.min(...a.versions.map((v) => v.min)) -
        Math.min(...b.versions.map((v) => v.min)) ||
      a.name.localeCompare(b.name),
  );
  return locations;
}

// --- Hauptlauf --------------------------------------------------------------
// Nur ausfuehren, wenn direkt gestartet (nicht beim Import fuer Tests).
const isMain = process.argv[1] && process.argv[1].endsWith("generate-swsh-encounters.mjs");
if (isMain) {
const namesRaw = JSON.parse(await readFile(NAMES_FILE, "utf8"));
const apiNameById = new Map(namesRaw.map((p) => [p.id, p.name]));

const ids = (ONLY ?? [])
  .concat(ONLY ? [] : Array.from({ length: TO - FROM + 1 }, (_, i) => FROM + i))
  .filter((id) => id >= 1 && id <= 1025);

const result = {};
let withData = 0;

for (const id of ids) {
  const apiName = apiNameById.get(id);
  let html = apiName ? await fetchLocationsHtml(apiName) : null;

  // Fallback: Slug per Redirect aufloesen, wenn der PokeAPI-Slug nicht passt.
  if (!html) {
    const slug = await slugFromRedirect(id);
    if (slug && slug !== apiName) html = await fetchLocationsHtml(slug);
  }

  if (html) {
    const locations = parseLocations(html);
    if (locations.length > 0) {
      result[id] = locations;
      withData++;
    }
  }

  process.stdout.write(
    `\r#${id} ${apiName ?? "?"} - ${withData} mit Fundorten   `,
  );
  await sleep(DELAY);
}

process.stdout.write("\n");

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(result) + "\n", "utf8");

console.log(`${withData} Pokemon mit Fundorten geschrieben nach ${OUT}`);
}
