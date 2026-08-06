import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useComparison } from "../context/useComparison";
import { useAuth } from "../context/useAuth";
import { fetchPokemonById } from "../services/pokeApi";
import { typeColors } from "./typeColors";
import { pokemonName } from "./pokemonName";
import styles from "./Comparison.module.css";

// Kampfwerte in Detailseiten-Reihenfolge; "total" wird separat aufsummiert.
const STAT_ROWS = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];

function statValue(p, key) {
  if (key === "total") return p.stats.reduce((sum, s) => sum + s.value, 0);
  return p.stats.find((s) => s.name === key)?.value ?? 0;
}

export default function Comparison() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { pokemonIds, loading, removeFromComparison } = useComparison();
  const [pokemons, setPokemons] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (pokemonIds.length === 0) {
      setPokemons([]);
      return;
    }
    let cancelled = false;
    setLoadingData(true);
    // fetchPokemonById ist gecacht → i.d.R. sofort; Reihenfolge der Liste bleibt.
    Promise.all(pokemonIds.map((id) => fetchPokemonById(id).catch(() => null)))
      .then((list) => !cancelled && setPokemons(list.filter(Boolean)))
      .finally(() => !cancelled && setLoadingData(false));
    return () => {
      cancelled = true;
    };
  }, [pokemonIds]);

  // Höchstwert je Zeile – nur relevant, wenn mindestens zwei verglichen werden.
  const compareActive = pokemons.length >= 2;
  const maxima = {};
  if (compareActive) {
    for (const key of [...STAT_ROWS, "total"]) {
      maxima[key] = Math.max(...pokemons.map((p) => statValue(p, key)));
    }
  }

  let content;
  if (!isAuthenticated) {
    content = <p className={styles.info}>{t("comparison.loginPrompt")}</p>;
  } else if (loading) {
    content = <p className={styles.info}>{t("comparison.loading")}</p>;
  } else if (pokemonIds.length === 0) {
    content = <p className={styles.info}>{t("comparison.empty")}</p>;
  } else if (pokemons.length === 0 && loadingData) {
    content = <p className={styles.info}>{t("comparison.loading")}</p>;
  } else {
    content = (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.corner} />
              {pokemons.map((p) => (
                <th key={p.id} className={styles.colHead}>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeFromComparison(p.id)}
                    aria-label={t("comparison.remove")}
                    title={t("comparison.remove")}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                  <Link to={`/pokemon/${p.id}`} className={styles.headLink}>
                    <img src={p.image} alt="" className={styles.sprite} />
                    <span className={styles.num}>
                      #{String(p.id).padStart(3, "0")}
                    </span>
                    <span className={styles.name}>
                      {pokemonName(p, i18n.language)}
                    </span>
                  </Link>
                  <div className={styles.types}>
                    {p.types.map((type) => (
                      <span
                        key={type}
                        className={styles.typeBadge}
                        style={{ backgroundColor: typeColors[type] }}
                      >
                        {t(`types.${type}`)}
                      </span>
                    ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAT_ROWS.map((key) => (
              <tr key={key}>
                <th className={styles.rowHead}>{t(`stats.${key}`)}</th>
                {pokemons.map((p) => {
                  const v = statValue(p, key);
                  return (
                    <td
                      key={p.id}
                      className={styles.cell}
                      data-best={compareActive && v === maxima[key]}
                    >
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th className={`${styles.rowHead} ${styles.totalHead}`}>
                {t("stats.total")}
              </th>
              {pokemons.map((p) => {
                const v = statValue(p, "total");
                return (
                  <td
                    key={p.id}
                    className={`${styles.cell} ${styles.totalCell}`}
                    data-best={compareActive && v === maxima.total}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th className={styles.rowHead}>{t("detail.height")}</th>
              {pokemons.map((p) => (
                <td key={p.id} className={styles.cell}>
                  {p.height / 10} m
                </td>
              ))}
            </tr>
            <tr>
              <th className={styles.rowHead}>{t("detail.weight")}</th>
              {pokemons.map((p) => (
                <td key={p.id} className={styles.cell}>
                  {p.weight / 10} kg
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t("comparison.title")}</h1>
      {content}
    </main>
  );
}
