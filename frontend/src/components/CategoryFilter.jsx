import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useFilter } from "../context/useFilter";
import styles from "./CategoryFilter.module.css";

const CATEGORIES = ["legendary", "mythical"];

export default function CategoryFilter() {
  const { t } = useTranslation();
  const { categories, toggleCategory } = useFilter();

  return (
    <div className={styles.field}>
      <span className={styles.label}>{t("filter.category")}</span>
      <div className={styles.chips}>
        {CATEGORIES.map((cat) => {
          const active = categories.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              className={styles.chip}
              data-active={active}
              onClick={() => toggleCategory(cat)}
              aria-pressed={active}
            >
              {t(`filter.${cat}`)}
              {active && <Check size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
