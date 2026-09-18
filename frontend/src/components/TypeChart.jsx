import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Swords } from "lucide-react";
import typeChart from "../data/typeChart.json";
import { typeColors } from "./typeColors";
import styles from "./TypeChart.module.css";

const { types: ALL_TYPES, chart } = typeChart;

const FACTOR_LABEL = { 0: "×0", 0.5: "×½", 2: "×2" };
const FACTOR_ORDER = [2, 0.5, 0]; // stark → schwach → wirkungslos

// Offensiv: was der gewählte Typ gegen die anderen anrichtet (eigene Zeile).
function offensive(type) {
  return groupByFactor((def) => chart[type][def] ?? 1);
}

// Defensiv: was die anderen Typen gegen den gewählten anrichten (eigene Spalte).
function defensive(type) {
  return groupByFactor((atk) => chart[atk][type] ?? 1);
}

function groupByFactor(factorOf) {
  return FACTOR_ORDER.map((factor) => ({
    factor,
    types: ALL_TYPES.filter((other) => factorOf(other) === factor),
  })).filter((group) => group.types.length > 0);
}

function Relations({ groups, t }) {
  return (
    <div className={styles.rows}>
      {groups.map(({ factor, types }) => (
        <div key={factor} className={styles.row}>
          <span className={styles.factor}>{FACTOR_LABEL[factor]}</span>
          <div className={styles.badges}>
            {types.map((type) => (
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
  );
}

export default function TypeChart() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <h1 className={styles.title}>
          <Swords size={22} aria-hidden="true" />
          {t("typechart.title")}
        </h1>
      </header>

      <p className={styles.lead}>{t("typechart.lead")}</p>

      <div className={styles.picker}>
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.pick} ${
              selected === type ? styles.pickActive : ""
            }`}
            style={{ backgroundColor: typeColors[type] }}
            aria-pressed={selected === type}
            onClick={() => setSelected(type)}
          >
            {t(`types.${type}`)}
          </button>
        ))}
      </div>

      {selected && (
        <div className={styles.result}>
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>{t("typechart.attack")}</h2>
            <Relations groups={offensive(selected)} t={t} />
          </section>
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>{t("typechart.defense")}</h2>
            <Relations groups={defensive(selected)} t={t} />
          </section>
          <p className={styles.note}>{t("typechart.neutralNote")}</p>
        </div>
      )}
    </main>
  );
}
