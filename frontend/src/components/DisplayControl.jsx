import { useTranslation } from "react-i18next";
import { List, LayoutGrid } from "lucide-react";
import { useDisplay } from "../context/useDisplay";
import styles from "./DisplayControl.module.css";

// "off" = kein Stat in der Liste. Restliche Werte nutzen die bestehenden
// stats.*-Labels der Detailseite wieder.
const FIELDS = [
  "off",
  "total",
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];

const LAYOUTS = [
  { value: "list", Icon: List },
  { value: "grid", Icon: LayoutGrid },
];

export default function DisplayControl() {
  const { t } = useTranslation();
  const { statField, setStatField, layout, setLayout } = useDisplay();

  const fieldLabel = (field) =>
    field === "off" ? t("display.off") : t(`stats.${field}`);

  return (
    <>
      <div className={styles.field}>
        <span className={styles.label}>{t("display.view")}</span>
        <div
          className={styles.toggle}
          role="group"
          aria-label={t("display.view")}
        >
          {LAYOUTS.map(({ value, Icon }) => (
            <button
              key={value}
              type="button"
              className={styles.toggleBtn}
              data-active={layout === value}
              onClick={() => setLayout(value)}
              aria-pressed={layout === value}
              title={t(`display.${value}`)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{t(`display.${value}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="displayStat" className={styles.label}>
          {t("display.label")}
        </label>
        <select
          id="displayStat"
          className={styles.select}
          value={statField}
          onChange={(e) => setStatField(e.target.value)}
        >
          {FIELDS.map((f) => (
            <option key={f} value={f}>
              {fieldLabel(f)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
