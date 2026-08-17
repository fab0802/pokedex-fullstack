export const games = [
  { id: "all", dexes: null, versionGroups: [], versions: [] },
  {
    id: "rby",
    dexes: ["kanto"],
    versionGroups: ["red-blue", "yellow"],
    versions: ["red", "blue", "yellow"],
  },
  {
    id: "gsc",
    dexes: ["original-johto"],
    versionGroups: ["gold-silver", "crystal"],
    versions: ["gold", "silver", "crystal"],
  },
  {
    id: "rse",
    dexes: ["hoenn"],
    versionGroups: ["ruby-sapphire", "emerald"],
    versions: ["ruby", "sapphire", "emerald"],
  },
  {
    id: "dpp",
    dexes: ["extended-sinnoh"],
    versionGroups: ["diamond-pearl", "platinum"],
    versions: ["diamond", "pearl", "platinum"],
  },
  {
    id: "bw",
    dexes: ["original-unova"],
    versionGroups: ["black-white", "black-2-white-2"],
    versions: ["black", "white", "black-2", "white-2"],
  },
  {
    id: "xy",
    dexes: ["kalos-central", "kalos-coastal", "kalos-mountain"],
    versionGroups: ["x-y"],
    versions: ["x", "y"],
  },
  {
    id: "sm",
    dexes: ["original-alola"],
    versionGroups: ["sun-moon", "ultra-sun-ultra-moon"],
    versions: ["sun", "moon", "ultra-sun", "ultra-moon"],
  },
  {
    id: "swsh",
    dexes: ["galar", "isle-of-armor", "crown-tundra"],
    versionGroups: ["sword-shield"],
    versions: ["sword", "shield"],
  },
  {
    id: "sv",
    dexes: ["paldea", "kitakami", "blueberry"],
    versionGroups: ["scarlet-violet"],
    versions: ["scarlet", "violet"],
  },
];

// Neueste zuerst - für den Fallback "neueste verfügbare Version"
export const VERSION_GROUP_ORDER = [
  "scarlet-violet",
  "legends-arceus",
  "brilliant-diamond-shining-pearl",
  "sword-shield",
  "lets-go-pikachu-lets-go-eevee",
  "ultra-sun-ultra-moon",
  "sun-moon",
  "omega-ruby-alpha-sapphire",
  "x-y",
  "black-2-white-2",
  "black-white",
  "heartgold-soulsilver",
  "platinum",
  "diamond-pearl",
  "firered-leafgreen",
  "emerald",
  "ruby-sapphire",
  "crystal",
  "gold-silver",
  "yellow",
  "red-blue",
];

// PokéAPI hat (Stand 2026) keine Fundort-Daten für Gen 8/9.
// swsh wird lokal aus src/data/encounters/swsh.json bedient
// (siehe services/localEncounters.js); sv folgt noch.
export const GAMES_WITHOUT_ENCOUNTERS = new Set(["sv"]);

// Version-Group-Slug -> interne Spiel-ID (fürs Label wiederverwendbar via games.<id>)
export const VG_TO_GAME_ID = Object.fromEntries(
  games.flatMap((g) => g.versionGroups.map((vg) => [vg, g.id])),
);
