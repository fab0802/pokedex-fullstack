import {
  Heart,
  Sword,
  Shield,
  Sparkles,
  ShieldHalf,
  Gauge,
  Sigma,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Zentrale Zuordnung Stat -> Icon, damit Detailseite und Listen-Karte
// garantiert dieselben Symbole nutzen.
const STAT_ICONS = {
  hp: Heart,
  attack: Sword,
  defense: Shield,
  "special-attack": Sparkles,
  "special-defense": ShieldHalf,
  speed: Gauge,
  total: Sigma,
};

export default function StatIcon({ stat, size = 18, className }) {
  const { t } = useTranslation();
  const Icon = STAT_ICONS[stat];
  if (!Icon) return null;

  const label = t(`stats.${stat}`);

  // Klartext-Name bleibt per Tooltip (title) und für Screenreader (aria-label)
  // erhalten, obwohl sichtbar nur das Icon steht.
  return (
    <span className={className} title={label} role="img" aria-label={label}>
      <Icon size={size} aria-hidden="true" />
    </span>
  );
}
