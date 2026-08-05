import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useFilter } from "../context/useFilter";
import { GENERATIONS } from "./pokemonView";
import styles from "./GenerationFilter.module.css";

export default function GenerationFilter() {
  const { t } = useTranslation();
  const { generations, toggleGeneration } = useFilter();

  return (
    <div className={styles.field}>
      <span className={styles.label}>{t("filter.generation")}</span>
      <div className={styles.chips}>
        {GENERATIONS.map((gen) => {
          const active = generations.includes(gen);
          return (
            <button
              key={gen}
              type="button"
              className={styles.chip}
              data-active={active}
              onClick={() => toggleGeneration(gen)}
              aria-pressed={active}
            >
              {t("filter.gen", { n: gen })}
              {active && <Check size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
