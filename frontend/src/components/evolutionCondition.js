function prettify(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Nimmt den lokalisierten Namen aus der Map. Faellt auf Englisch und
// zuletzt auf den aufgehuebschten Slug zurueck.
function localized(kind, slug, names, lang) {
  const entry = names?.[`${kind}:${slug}`];
  const preferred = lang?.startsWith("de") ? entry?.de : entry?.en;
  return preferred ?? entry?.en ?? prettify(slug);
}

// evolution_details ist ein Array, weil es mehrere alternative Wege
// geben kann. Wir nehmen den ersten und bauen daraus ein kurzes Label.
export function formatEvolutionCondition(details, t, names, lang) {
  const d = details?.[0];
  if (!d) return "";

  const parts = [];
  if (d.min_level) parts.push(t("evolution.level", { level: d.min_level }));
  if (d.item?.name) parts.push(localized("item", d.item.name, names, lang));
  if (d.held_item?.name)
    parts.push(localized("item", d.held_item.name, names, lang));
  if (d.known_move?.name)
    parts.push(localized("move", d.known_move.name, names, lang));
  if (d.location?.name)
    parts.push(localized("location", d.location.name, names, lang));
  if (d.min_happiness) parts.push(t("evolution.happiness"));
  if (d.time_of_day) parts.push(t(`evolution.time.${d.time_of_day}`));
  if (d.known_move_type?.name)
    parts.push(
      t("evolution.knownMoveType", {
        type: t(`types.${d.known_move_type.name}`),
      }),
    );
  if (d.trigger?.name === "trade") parts.push(t("evolution.trade"));

  return parts.length > 0 ? parts.join(" · ") : t("evolution.unknown");
}
