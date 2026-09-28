import { Crown, Sparkles } from "lucide-react";

const ICONS = {
  legendary: Crown,
  mythical: Sparkles,
};

// Icon für legendär/mystisch. Für "standard" wird nichts gerendert.
// Mit label: eigenständiges Icon mit Tooltip + Screenreader-Text.
// Ohne label: rein dekorativ (Text steht daneben).
export default function CategoryIcon({ category, size = 14, label, className }) {
  const Icon = ICONS[category];
  if (!Icon) return null;

  if (!label) return <Icon size={size} aria-hidden="true" />;

  return (
    <span className={className} role="img" aria-label={label} title={label}>
      <Icon size={size} aria-hidden="true" />
    </span>
  );
}
