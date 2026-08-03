import { useTranslation } from "react-i18next";
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

export default function DisplayControl() {
  const { t } = useTranslation();
  const { statField, setStatField } = useDisplay();

  const fieldLabel = (field) =>
    field === "off" ? t("display.off") : t(`stats.${field}`);

  return (
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
  );
}
