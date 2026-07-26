import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchTypeEffectiveness } from "../services/pokeApi";
import { typeColors } from "./typeColors";
import styles from "./TypeMatchups.module.css";

const FACTOR_LABEL = {
  0: "×0",
  0.25: "×¼",
  0.5: "×½",
  1: "×1",
  2: "×2",
  4: "×4",
};

export default function TypeMatchups({ types, hideTitle = false }) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchTypeEffectiveness(types)
      .then((res) => !cancelled && setGroups(res))
      .catch(() => !cancelled && setGroups(null));
    return () => {
      cancelled = true;
    };
  }, [types]);

  if (!groups || groups.length === 0) return null;

  return (
    <div className={`${styles.section} ${hideTitle ? styles.flush : ""}`}>
      {!hideTitle && <h2 className={styles.title}>{t("detail.matchups")}</h2>}
      <div className={styles.rows}>
        {groups.map(({ factor, types: rowTypes }) => (
          <div key={factor} className={styles.row}>
            <span className={styles.factor}>
              {FACTOR_LABEL[factor] ?? `×${factor}`}
            </span>
            <div className={styles.badges}>
              {rowTypes.map((type) => (
                <span
                  key={type}
                  className={styles.badge}
                  style={{ backgroundColor: typeColors[type] }}
                >
                  {t(`types.${type}`)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
