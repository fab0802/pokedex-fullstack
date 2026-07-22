function prettify(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// evolution_details ist ein Array, weil es mehrere alternative Wege
// geben kann. Wir nehmen den ersten und bauen daraus ein kurzes Label.
export function formatEvolutionCondition(details, t) {
  const d = details?.[0];
  if (!d) return "";

  const parts = [];
  if (d.min_level) parts.push(t("evolution.level", { level: d.min_level }));
  if (d.item?.name) parts.push(prettify(d.item.name));
  if (d.held_item?.name) parts.push(prettify(d.held_item.name));
  if (d.known_move?.name) parts.push(prettify(d.known_move.name));
  if (d.known_move_type?.name)
    parts.push(
      t("evolution.knownMoveType", { type: t(`types.${d.known_move_type.name}`) }),
    );
  if (d.location?.name) parts.push(prettify(d.location.name));
  if (d.min_happiness) parts.push(t("evolution.happiness"));
  if (d.time_of_day) parts.push(t(`evolution.time.${d.time_of_day}`));
  if (d.trigger?.name === "trade") parts.push(t("evolution.trade"));

  return parts.length > 0 ? parts.join(" · ") : t("evolution.unknown");
}
