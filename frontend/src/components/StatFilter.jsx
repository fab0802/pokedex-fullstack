import { useTranslation } from "react-i18next";
import { useFilter } from "../context/useFilter";
import styles from "./StatFilter.module.css";

// "total" nutzt stats.total wieder; Reihenfolge wie in der Detailansicht.
const FIELDS = [
  "total",
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];

export default function StatFilter() {
  const { t } = useTranslation();
  const { stat, setStatField, setStatMin, setStatMax } = useFilter();

  // Nur Ziffern zulassen (leeres Feld = offene Grenze).
  const onNum = (setter) => (e) => setter(e.target.value.replace(/[^0-9]/g, ""));

  return (
    <div className={styles.field}>
      <label htmlFor="statField" className={styles.label}>
        {t("filter.stat")}
      </label>
      <select
        id="statField"
        className={styles.select}
        value={stat.field ?? ""}
        onChange={(e) => setStatField(e.target.value || null)}
      >
        <option value="">{t("filter.statAny")}</option>
        {FIELDS.map((f) => (
          <option key={f} value={f}>
            {t(`stats.${f}`)}
          </option>
        ))}
      </select>

      {stat.field && (
        <div className={styles.rangeRow}>
          <input
            type="text"
            inputMode="numeric"
            className={styles.num}
            value={stat.min}
            onChange={onNum(setStatMin)}
            placeholder={t("filter.min")}
            aria-label={t("filter.min")}
          />
          <span className={styles.dash}>{t("filter.to")}</span>
          <input
            type="text"
            inputMode="numeric"
            className={styles.num}
            value={stat.max}
            onChange={onNum(setStatMax)}
            placeholder={t("filter.max")}
            aria-label={t("filter.max")}
          />
        </div>
      )}
    </div>
  );
}
