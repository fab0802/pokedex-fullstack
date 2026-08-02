import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useFilter } from "../context/useFilter";
import styles from "./SortControl.module.css";

// "number" = Pokédex-Reihenfolge (Sortierung aus). Restliche Werte nutzen die
// bestehenden stats.*-Labels der Detailseite wieder.
const FIELDS = [
  "number",
  "total",
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];

export default function SortControl() {
  const { t } = useTranslation();
  const { sort, setSortField, setSortDir } = useFilter();

  const fieldLabel = (field) =>
    field === "number" ? t("sort.number") : t(`stats.${field}`);

  return (
    <div className={styles.field}>
      <label htmlFor="sortField" className={styles.label}>
        {t("sort.label")}
      </label>
      <select
        id="sortField"
        className={styles.select}
        value={sort.field}
        onChange={(e) => setSortField(e.target.value)}
      >
        {FIELDS.map((f) => (
          <option key={f} value={f}>
            {fieldLabel(f)}
          </option>
        ))}
      </select>

      <div className={styles.dirRow} role="group" aria-label={t("sort.label")}>
        <button
          type="button"
          className={styles.dirButton}
          data-active={sort.dir === "asc"}
          onClick={() => setSortDir("asc")}
        >
          <ArrowUp size={15} aria-hidden="true" />
          {t("sort.asc")}
        </button>
        <button
          type="button"
          className={styles.dirButton}
          data-active={sort.dir === "desc"}
          onClick={() => setSortDir("desc")}
        >
          <ArrowDown size={15} aria-hidden="true" />
          {t("sort.desc")}
        </button>
      </div>
    </div>
  );
}
