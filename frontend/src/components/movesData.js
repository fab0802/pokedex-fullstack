import movesJson from "../data/moves.json";
import { moveName } from "./moveName";
import { moveType } from "./moveType";

const { moves: BASE, byVersionGroup } = movesJson;

// Alle Attacken, die in irgendeinem unserer Spiele lernbar sind.
// (moves.json enthält auch Max-/Z-/Shadow-Attacken, die will die Liste nicht.)
const ALL_SLUGS = [
  ...new Set(Object.values(byVersionGroup).flatMap((vg) => Object.keys(vg))),
];

// Eine Attacke mit den Werten für ein bestimmtes Spiel.
// overrides = Abweichungen aus byVersionGroup (tm, power, type, class, …)
function build(slug, overrides = {}) {
  const base = BASE[slug];
  return {
    slug,
    power: "power" in overrides ? overrides.power : base.power,
    accuracy: "accuracy" in overrides ? overrides.accuracy : base.accuracy,
    pp: "pp" in overrides ? overrides.pp : base.pp,
    class: overrides.class ?? base.class,
    type: overrides.type ?? moveType(slug),
    priority: base.priority,
    tm: overrides.tm ?? null,
  };
}

// Liste für das gewählte Spiel. Ohne Spiel: alle Attacken mit aktuellen Werten.
// Hat ein Spiel mehrere Version-Groups (z. B. S/W + S2/W2), gewinnt die
// neuere – sie steht in games.js jeweils hinten.
export function getMovesForGame(game) {
  if (!game || game.id === "all") return ALL_SLUGS.map((slug) => build(slug));

  const merged = {};
  for (const vg of game.versionGroups) {
    for (const [slug, overrides] of Object.entries(byVersionGroup[vg] ?? {})) {
      merged[slug] = overrides;
    }
  }
  return Object.entries(merged).map(([slug, o]) => build(slug, o));
}

// "tm125" -> "TM125", "hm04" -> "VM04" (DE) / "HM04" (EN), "tr12" -> "TR12"
export function formatMachine(item, lang) {
  if (!item) return null;
  const match = item.match(/^(tm|hm|tr)(\d+)$/);
  if (!match) return item.toUpperCase();
  const [, kind, num] = match;
  const de = lang?.startsWith("de");
  const prefix = kind === "hm" ? (de ? "VM" : "HM") : kind.toUpperCase();
  return `${prefix}${num}`;
}

// Sortierwert je Spalte. null/undefined landen immer am Ende (siehe MovesList).
export function sortValue(move, key, lang) {
  switch (key) {
    case "name":
      return moveName(move.slug, lang);
    case "tm": {
      if (!move.tm) return null;
      const match = move.tm.match(/^(tm|hm|tr)(\d+)$/);
      // HM vor TM vor TR, danach nach Nummer
      const rank = { hm: 0, tm: 1, tr: 2 }[match?.[1]] ?? 3;
      return rank * 10000 + Number(match?.[2] ?? 0);
    }
    default:
      return move[key];
  }
}
