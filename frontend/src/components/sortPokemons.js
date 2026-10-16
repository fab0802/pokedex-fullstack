// Gemeinsame Sortierlogik für Liste und Detail-Navigation (eine Quelle).

export function statValue(p, field) {
  if (field === "number") return p.id;
  if (field === "total") return p.stats.reduce((sum, s) => sum + s.value, 0);
  const s = p.stats.find((x) => x.name === field);
  return s ? s.value : 0;
}

// Vergleichsfunktion für Array.sort. rank(p) = Position im aktiven Dex
// (regional bei gewähltem Spiel); ohne rank gilt die nationale ID.
// "number" sortiert nach diesem Rang, gleiche Stat-Werte ebenfalls -> stabil.
export function comparePokemon(sort, rank = (p) => p.id) {
  return (a, b) => {
    const primary =
      sort.field === "number"
        ? rank(a) - rank(b)
        : statValue(a, sort.field) - statValue(b, sort.field);
    if (primary !== 0) return sort.dir === "asc" ? primary : -primary;
    return rank(a) - rank(b);
  };
}

// Referenz-Maxima je Feld für den Balken in der Liste. Bewusst leicht
// grosszügig, damit reale Werte selten anschlagen; Fill wird ohnehin gekappt.
const STAT_MAX = {
  total: 720,
  hp: 255,
  attack: 190,
  defense: 230,
  "special-attack": 194,
  "special-defense": 230,
  speed: 200,
};

export function statMax(field) {
  return STAT_MAX[field] ?? 255;
}

// Prozentwert (0–100) relativ zum Referenz-Max, gekappt.
export function statPercent(p, field) {
  const pct = (statValue(p, field) / statMax(field)) * 100;
  return Math.max(0, Math.min(100, pct));
}
