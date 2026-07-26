export const games = [
  { label: "All", dexes: null, versionGroups: [] },
  {
    label: "Red/Blue/Yellow",
    dexes: ["kanto"],
    versionGroups: ["red-blue", "yellow"],
  },
  {
    label: "Gold/Silver/Crystal",
    dexes: ["original-johto"],
    versionGroups: ["gold-silver", "crystal"],
  },
  {
    label: "Ruby/Sapphire/Emerald",
    dexes: ["hoenn"],
    versionGroups: ["ruby-sapphire", "emerald"],
  },
  {
    label: "Diamond/Pearl/Platinum",
    dexes: ["extended-sinnoh"],
    versionGroups: ["diamond-pearl", "platinum"],
  },
  {
    label: "Black/White",
    dexes: ["original-unova"],
    versionGroups: ["black-white", "black-2-white-2"],
  },
  {
    label: "X/Y",
    dexes: ["kalos-central", "kalos-coastal", "kalos-mountain"],
    versionGroups: ["x-y"],
  },
  {
    label: "Sun/Moon",
    dexes: ["original-alola"],
    versionGroups: ["sun-moon", "ultra-sun-ultra-moon"],
  },
  {
    label: "Sword/Shield",
    dexes: ["galar", "isle-of-armor", "crown-tundra"],
    versionGroups: ["sword-shield"],
  },
  {
    label: "Scarlet/Violet",
    dexes: ["paldea", "kitakami", "blueberry"],
    versionGroups: ["scarlet-violet"],
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
