import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { typeColors } from "./typeColors";
import { useFilter } from "../context/useFilter";
import styles from "./TypeFilter.module.css";

const TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

export default function TypeFilter() {
  const { t } = useTranslation();
  const { types, toggleType } = useFilter();

  return (
    <div className={styles.field}>
      <span className={styles.label}>{t("filter.type")}</span>
      <div className={styles.chips}>
        {TYPES.map((type) => {
          const active = types.includes(type);
          return (
            <button
              key={type}
              type="button"
              className={styles.chip}
              data-active={active}
              style={active ? { borderColor: typeColors[type] } : undefined}
              onClick={() => toggleType(type)}
              aria-pressed={active}
            >
              <span
                className={styles.dot}
                style={{ backgroundColor: typeColors[type] }}
              />
              {t(`types.${type}`)}
              {active && (
                <Check
                  size={14}
                  aria-hidden="true"
                  style={{ color: typeColors[type] }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
