import moveNames from "../data/moveNames.json";

function prettify(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// slug -> Anzeigename; DE mit Fallback auf EN, sonst aufgehübschter Slug
export function moveName(slug, lang) {
  const entry = moveNames[slug];
  if (!entry) return prettify(slug);
  const de = lang && lang.startsWith("de");
  return (de ? entry.de : entry.en) || entry.en || prettify(slug);
}
