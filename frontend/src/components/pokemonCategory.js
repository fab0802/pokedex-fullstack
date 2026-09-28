// Kategorien eines Pokémon. "standard" = weder legendär noch mystisch.
// Eine Quelle für Filter, Karten und Detailseite -> überall gleiche Logik.
export const CATEGORIES = ["standard", "legendary", "mythical"];

export function categoryOf(p) {
  if (p.isLegendary) return "legendary";
  if (p.isMythical) return "mythical";
  return "standard";
}
