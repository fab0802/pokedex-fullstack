// Gemeinsame Sortierlogik für Liste und Detail-Navigation (eine Quelle).

export function statValue(p, field) {
  if (field === "number") return p.id;
  if (field === "total") return p.stats.reduce((sum, s) => sum + s.value, 0);
  const s = p.stats.find((x) => x.name === field);
  return s ? s.value : 0;
}

// Vergleichsfunktion für Array.sort. Gleiche Werte werden stabil über die ID
// aufgelöst, damit nichts springt.
export function comparePokemon(sort) {
  return (a, b) => {
    const primary = statValue(a, sort.field) - statValue(b, sort.field);
    if (primary !== 0) return sort.dir === "asc" ? primary : -primary;
    return a.id - b.id;
  };
}
