import { useTranslation } from "react-i18next";
import { Sword, Sparkles, CircleDashed } from "lucide-react";

const ICONS = {
  physical: Sword,
  special: Sparkles,
  status: CircleDashed,
};

// Kategorie als Icon. title = Tooltip (Desktop), aria-label = Screenreader.
export default function MoveCategoryIcon({ category, size = 16 }) {
  const { t } = useTranslation();
  const Icon = ICONS[category];
  if (!Icon) return null;
  const label = t(`moveGuide.class.${category}`);
  return (
    <span title={label} aria-label={label} role="img" style={{ display: "inline-flex" }}>
      <Icon size={size} aria-hidden="true" />
    </span>
  );
}
