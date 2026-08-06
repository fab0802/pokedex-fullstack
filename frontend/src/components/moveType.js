import moveNames from "../data/moveNames.json";

// slug -> Typ-Slug (z. B. "fire") oder null, falls unbekannt.
// Quelle: moveNames.json (via scripts/generate-move-names.mjs erzeugt).
export function moveType(slug) {
  return moveNames[slug]?.type ?? null;
}
