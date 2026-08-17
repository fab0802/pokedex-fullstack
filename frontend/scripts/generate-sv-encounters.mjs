// Erzeugt src/data/encounters/sv.json aus den Serebii-Pokearth-Gebietsseiten
// (Paldea). Einmalig ausfuehren:  npm run generate:sv-encounters
//
// Warum anders als bei SWSH: Bei Scarlet/Violet gibt es KEINE Fundort-Tabelle
// pro Pokemon. Die Wild-Daten stehen stattdessen pro *Gebiet* (Pokearth Paldea)
// als interaktive Karte im HTML - je Gebiet eine Liste der vorkommenden Arten
// plus Level je Spawn-Marker. Wir scrapen also die ~50 Gebietsseiten und drehen
// das um zu einem Lookup nach National-Dex-ID. Die Spawns sind laut Serebii
// bewusst ungefaehr ("Umgebung/Radius"), und Scarlet/Violet-Exklusivitaet laesst
// sich aus dem Marker-Text nicht sauber trennen -> wir schreiben beide Versionen
// mit gleicher Level-Spanne (die UI zeigt dann korrekt KEIN Exklusiv-Label).
//
// Wild-Level: Serebiis SV-Seiten legen fuer die normalen Spawns KEIN Level offen
// (die interaktive Leaflet-Karte kennt nur Koordinaten/Art, kein Level; ein Level
// steht statisch nur bei den wenigen "Fixed Spawns"). Wir liefern daher bewusst
// nur die Gebiete pro Art aus -> min/max sind null, und die UI blendet die
// Level-Angabe dann aus.
//
// Ergebnis-Struktur (identisch zu swsh.json, damit die UI unveraendert bleibt):
//   {
//     "915": [
//       { "location": "southprovinceareaone", "name": "South Province Area One",
//         "versions": [
//           { "version": "scarlet", "min": null, "max": null },
//           { "version": "violet",  "min": null, "max": null }
//         ] }
//     ]
//   }
//
// Flags (alle optional):
//   --only <slugs>   nur diese Gebiets-Slugs, kommagetrennt (zum Testen)
//   --limit <n>      nur die ersten n Gebiete (zum Testen)
//   --debug          eine lesbare Zusammenfassung je Gebiet ausgeben (Coverage)
//   --list           nur die gefundenen Gebiets-Slugs ausgeben, dann Stopp
//   --delay <ms>     Pause zwischen Requests (Default 500, hoeflich bleiben)
//   --out <pfad>     Ziel-Datei ueberschreiben

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const BASE = "https://www.serebii.net";
const PALDEA_INDEX = `${BASE}/pokearth/paldea/`;
const UA = "pokedex-fullstack portfolio scraper (one-time, respectful)";

const DEFAULT_OUT = fileURLToPath(
  new URL("../src/data/encounters/sv.json", import.meta.url),
);

// Fallback-Gebietsliste, falls das Index-Scraping nichts findet. Slugs folgen
// Serebiis Konvention (Name -> lowercase ohne Sonderzeichen).
const FALLBACK_AREA_NAMES = [
  "Alfornada", "Alfornada Cavern", "Area Zero", "Artazon", "Asado Desert",
  "Cabo Poco", "Cascarrafa", "Casseroya Lake", "Cortondo", "Dalizapa Passage",
  "East Paldean Sea", "East Province Area One", "East Province Area Two",
  "East Province Area Three", "Glaseado Mountain", "Great Crater of Paldea",
  "Inlet Grotto", "Levincia", "Los Platos", "Medali", "Mesagoza",
  "Montenevera", "Naranja Academy", "North Paldean Sea",
  "North Province Area One", "North Province Area Two",
  "North Province Area Three", "Poco Path", "Pokemon League",
  "Porto Marinada", "Socarrat Trail", "South Paldean Sea",
  "South Province Area One", "South Province Area Two",
  "South Province Area Three", "South Province Area Four",
  "South Province Area Five", "South Province Area Six", "Tagtree Thicket",
  "Uva Academy", "West Paldean Sea", "West Province Area One",
  "West Province Area Two", "West Province Area Three", "Zapapico",
  "Zero Gate", "Zero Lab",
];

// --- CLI-Argumente ---------------------------------------------------------
function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const hasFlag = (flag) => process.argv.includes(flag);

const ONLY = arg("--only", null)
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const LIMIT = arg("--limit", null) ? Number(arg("--limit", null)) : null;
const DEBUG = hasFlag("--debug");
const LIST_ONLY = hasFlag("--list");
const DUMP = hasFlag("--dump");
const DELAY = Number(arg("--delay", 700));
const OUT = arg("--out", DEFAULT_OUT);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nameToSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

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

// Robuster Abruf: wiederholt auch bei HTTP-Fehlern (z. B. 429/503 durch
// Throttling) und bei verdaechtig kurzen Antworten. Gibt erst nach mehreren
// Versuchen null zurueck.
async function fetchHtml(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await get(url);
    if (res && res.ok) {
      const text = await res.text();
      // Echte Gebietsseiten sind gross (~450 kB). Sehr kurze Antworten sind
      // meist Fehler-/Drosselseiten -> erneut versuchen.
      if (text.length > 20000) return text;
    }
    if (attempt < 4) await sleep(1000 * attempt);
  }
  return null;
}

// --- Parsing ----------------------------------------------------------------

// Arten des Gebiets aus der Filter-Liste (interaktive Karte). Jede Art ist ein
// Toggle-Anker <a href="#id=..."> mit einem Icon <img src="/pokedex-sv/icon/NNN.png">.
// Die Dex-Nummer steht im Icon-Pfad (nicht im Text). Liefert Map dex -> Name.
export function filterSpeciesMap($) {
  const map = new Map();
  $('a[href^="#id="]').each((_, a) => {
    const src = $(a).find("img").attr("src") || "";
    // Icon-Pfad kann Unterordner haben, z. B. /icon/054.png ODER /icon/new/025.png.
    const m = src.match(/\/pokedex-sv\/icon\/(?:[^"]*\/)?(\d+)\.png/i);
    if (!m) return;
    const dex = Number(m[1]);
    if (dex < 1 || dex > 1025) return;
    const name = $(a).text().replace(/\s+/g, " ").trim();
    if (!map.has(dex)) map.set(dex, name);
  });
  return map;
}

// Aus einer Gebietsseite die Wild-Arten extrahieren.
// Wild-Level pro Art sind in Serebiis statischer Seite fuer die normalen Spawns
// nicht enthalten (nur die Leaflet-Karte kennt sie, ohne Level) -> min/max null.
// Rueckgabe: Map dex -> { min, max }
export function parseArea(html) {
  const $ = load(html);
  const species = filterSpeciesMap($);
  const byDex = new Map();
  for (const dex of species.keys()) byDex.set(dex, { min: null, max: null });
  return byDex;
}

// Gebietsname aus dem <title> ("South Province Area One - Paldea - ...").
export function areaNameFromHtml(html, slug) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (m) {
    const name = m[1].split(" - ")[0].trim();
    if (name) return name;
  }
  return slug;
}

// --- Gebiets-Slugs ermitteln -----------------------------------------------
async function discoverAreaSlugs() {
  const html = await fetchHtml(PALDEA_INDEX);
  const slugs = new Set();
  if (html) {
    const $ = load(html);
    // Navigation ist ein Dropdown: <option value="slug.shtml">Name</option>.
    // Zusaetzlich klassische <a>/<area>-Links beruecksichtigen.
    $("option[value], a[href], area[href]").each((_, el) => {
      const raw = $(el).attr("value") || $(el).attr("href") || "";
      const m =
        raw.match(/^([^/"]+)\.shtml$/i) ||
        raw.match(/\/pokearth\/paldea\/([^/"]+)\.shtml/i);
      if (m && m[1].toLowerCase() !== "index") slugs.add(m[1]);
    });
  }
  if (slugs.size === 0) {
    for (const n of FALLBACK_AREA_NAMES) slugs.add(nameToSlug(n));
  }
  return [...slugs];
}

// --- Hauptlauf --------------------------------------------------------------
const isMain =
  process.argv[1] && process.argv[1].endsWith("generate-sv-encounters.mjs");
if (isMain) {
  let slugs = ONLY ?? (await discoverAreaSlugs());
  slugs.sort();
  if (LIMIT) slugs = slugs.slice(0, LIMIT);

  if (LIST_ONLY) {
    console.log(`${slugs.length} Gebiete:`);
    console.log(slugs.join("\n"));
    process.exit(0);
  }

  // Diagnose: rohes HTML eines Gebiets speichern + Kennzahlen ausgeben.
  if (DUMP) {
    const slug = slugs[0];
    const url = `${BASE}/pokearth/paldea/${slug}.shtml`;
    const html = (await fetchHtml(url)) ?? "";
    const dumpPath = fileURLToPath(
      new URL("./_sv-dump.html", import.meta.url),
    );
    await writeFile(dumpPath, html, "utf8");
    const count = (re) => (html.match(re) || []).length;
    console.log(`URL: ${url}`);
    console.log(`HTML-Laenge: ${html.length}`);
    console.log(`enthaelt "Interactive Map": ${/Interactive Map/i.test(html)}`);
    console.log(`#id= Anker: ${count(/href="#id=/gi)}`);
    console.log(`/pokedex-sv/ Links: ${count(/\/pokedex-sv\//gi)}`);
    console.log(`"Level" Vorkommen: ${count(/Level/gi)}`);
    console.log(`<script> Tags: ${count(/<script/gi)}`);
    console.log(`<h2 ...Trainers: ${count(/<h2[^>]*>\s*Trainers/gi)}`);
    console.log(`\nRoh-HTML gespeichert: ${dumpPath}`);
    process.exit(0);
  }

  // Aufbau: dex -> Map<areaSlug, { name, min, max }>
  const perDex = new Map();
  let areasWithData = 0;
  const unreachable = [];
  const emptyAreas = [];

  for (const slug of slugs) {
    const html = await fetchHtml(`${BASE}/pokearth/paldea/${slug}.shtml`);
    if (!html) {
      unreachable.push(slug);
      if (DEBUG) console.log(`\n[skip] ${slug}: nicht erreichbar`);
      await sleep(DELAY);
      continue;
    }
    const name = areaNameFromHtml(html, slug);
    const byDex = parseArea(html);

    for (const dex of byDex.keys()) {
      if (!perDex.has(dex)) perDex.set(dex, new Map());
      perDex.get(dex).set(slug, { name, min: null, max: null });
    }
    if (byDex.size > 0) areasWithData++;
    else emptyAreas.push(slug);

    if (DEBUG) {
      console.log(`\n${slug} (${name}): ${byDex.size} Arten`);
    } else {
      process.stdout.write(`\r${slug} - ${byDex.size} Arten        `);
    }
    await sleep(DELAY);
  }

  process.stdout.write("\n");

  // In die Ziel-Struktur giessen (beide Versionen, gleiche Level-Spanne).
  const result = {};
  for (const [dex, areas] of perDex) {
    const list = [...areas.entries()]
      .map(([location, { name, min, max }]) => ({
        location,
        name,
        versions: [
          { version: "scarlet", min, max },
          { version: "violet", min, max },
        ],
      }))
      .sort(
        (a, b) =>
          (a.versions[0].min ?? 999) - (b.versions[0].min ?? 999) ||
          a.name.localeCompare(b.name),
      );
    result[dex] = list;
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(result) + "\n", "utf8");

  console.log(
    `${Object.keys(result).length} Pokemon aus ${areasWithData} Gebieten geschrieben nach ${OUT}`,
  );
  if (emptyAreas.length) {
    console.log(
      `\nGebiete ohne Arten (${emptyAreas.length}, meist Staedte/Gebaeude): ${emptyAreas.join(", ")}`,
    );
  }
  if (unreachable.length) {
    console.log(
      `\nNICHT erreichbar (${unreachable.length}) - ggf. erneut laufen lassen: ${unreachable.join(", ")}`,
    );
  }
}
