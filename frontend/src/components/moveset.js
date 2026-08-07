import { VERSION_GROUP_ORDER } from "./games";

// Welche Version-Group zeigen wir? Erst die des gewählten Spiels, sonst die
// neueste, in der das Pokémon überhaupt Moves hat.
export function pickVersionGroup(moves, game) {
  const available = new Set();
  for (const m of moves)
    for (const d of m.details) available.add(d.versionGroup);

  for (const vg of game.versionGroups) if (available.has(vg)) return vg;

  let best = null;
  let bestRank = Infinity;
  for (const vg of available) {
    const idx = VERSION_GROUP_ORDER.indexOf(vg);
    const rank = idx === -1 ? Infinity : idx;
    if (rank < bestRank) {
      bestRank = rank;
      best = vg;
    }
  }
  return best ?? [...available][0] ?? null;
}

// Rohe Moves eines Pokémon in nach Methode gruppierte, sortierte Listen
// für die gewählte Version-Group umwandeln.
export function buildMoveset(moves, game) {
  if (!moves || moves.length === 0) return null;
  const vg = pickVersionGroup(moves, game);
  if (!vg) return null;

  const byMethod = { "level-up": [], machine: [], egg: [], tutor: [] };
  for (const m of moves) {
    for (const d of m.details) {
      if (d.versionGroup !== vg || !byMethod[d.method]) continue;
      byMethod[d.method].push({ slug: m.slug, level: d.level });
    }
  }
  byMethod["level-up"].sort(
    (a, b) => a.level - b.level || a.slug.localeCompare(b.slug),
  );
  for (const k of ["machine", "egg", "tutor"]) {
    byMethod[k].sort((a, b) => a.slug.localeCompare(b.slug));
  }
  return { versionGroup: vg, byMethod };
}

// Version-Group-Slug als lesbaren Namen, falls kein Spiel-Label existiert.
export function prettifyVg(vg) {
  return vg
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
