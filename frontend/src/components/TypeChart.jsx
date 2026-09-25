import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Swords } from "lucide-react";
import typeChart from "../data/typeChart.json";
import { typeColors } from "./typeColors";
import styles from "./TypeChart.module.css";

const { types: ALL_TYPES, chart } = typeChart;

const FACTOR_LABEL = { 0: "×0", 0.25: "×¼", 0.5: "×½", 2: "×2", 4: "×4" };
const FACTOR_ORDER = [4, 2, 0.5, 0.25, 0]; // sehr stark → wirkungslos
const MAX_SELECTED = 2;

// Offensiv: was der gewählte Typ gegen die anderen anrichtet (eigene Zeile).
function offensive(type) {
  return groupByFactor((def) => chart[type][def] ?? 1);
}

// Defensiv: was die anderen Typen gegen die gewählten anrichten.
// Bei zwei Typen werden die Faktoren multipliziert (z. B. 2 × 2 = ×4).
function defensive(types) {
  return groupByFactor((atk) =>
    types.reduce((total, def) => total * (chart[atk][def] ?? 1), 1)
  );
}

// Toggle: aktiver Typ wird entfernt, sonst hinzugefügt.
// Sind schon zwei gewählt, fliegt der älteste (erste) raus.
function toggleType(current, type) {
  if (current.includes(type)) return current.filter((t) => t !== type);
  const next = [...current, type];
  return next.length > MAX_SELECTED ? next.slice(1) : next;
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
  const [selected, setSelected] = useState([]);
  const isDual = selected.length === MAX_SELECTED;

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
              selected.includes(type) ? styles.pickActive : ""
            }`}
            style={{ backgroundColor: typeColors[type] }}
            aria-pressed={selected.includes(type)}
            onClick={() => setSelected((cur) => toggleType(cur, type))}
          >
            {t(`types.${type}`)}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className={styles.result}>
          {selected.map((type) => (
            <section key={type} className={styles.block}>
              <h2 className={styles.blockTitle}>
                {isDual
                  ? t("typechart.attackAs", { type: t(`types.${type}`) })
                  : t("typechart.attack")}
              </h2>
              <Relations groups={offensive(type)} t={t} />
            </section>
          ))}
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>
              {isDual ? t("typechart.defenseDual") : t("typechart.defense")}
            </h2>
            <Relations groups={defensive(selected)} t={t} />
          </section>
          <p className={styles.note}>{t("typechart.neutralNote")}</p>
        </div>
      )}
    </main>
  );
}
