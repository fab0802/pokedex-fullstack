import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useComparison } from "../context/useComparison";
import { useAuth } from "../context/useAuth";
import { useGame } from "../context/useGame";
import { fetchPokemonById } from "../services/pokeApi";
import { typeColors } from "./typeColors";
import { pokemonName } from "./pokemonName";
import { moveName } from "./moveName";
import { moveType } from "./moveType";
import { VG_TO_GAME_ID } from "./games";
import { prettifyVg } from "./moveset";
import { useComparisonMoves } from "./useComparisonMoves";
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

const METHOD_ORDER = ["level-up", "machine", "egg", "tutor"];
const METHOD_LABEL = {
  "level-up": "moves.levelUp",
  machine: "moves.machine",
  egg: "moves.egg",
  tutor: "moves.tutor",
};

function statValue(p, key) {
  if (key === "total") return p.stats.reduce((sum, s) => sum + s.value, 0);
  return p.stats.find((s) => s.name === key)?.value ?? 0;
}

export default function Comparison() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { selectedGame } = useGame();
  const { pokemonIds, loading, removeFromComparison } = useComparison();
  const [pokemons, setPokemons] = useState([]);
  const [openMethods, setOpenMethods] = useState(() => new Set(["level-up"]));

  const {
    movesetById,
    sharedSlugs,
    versionGroup,
    loading: movesLoading,
  } = useComparisonMoves(pokemonIds, selectedGame);

  function toggleMethod(method) {
    setOpenMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) next.delete(method);
      else next.add(method);
      return next;
    });
  }

  useEffect(() => {
    if (pokemonIds.length === 0) return;
    let cancelled = false;
    // fetchPokemonById ist gecacht → i.d.R. sofort. setState nur im then (async),
    // damit kein synchroner setState im Effekt-Body steht.
    Promise.all(
      pokemonIds.map((id) => fetchPokemonById(id).catch(() => null)),
    ).then((list) => {
      if (!cancelled) setPokemons(list.filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
  }, [pokemonIds]);

  // Angezeigte Pokémon aus der Liste ableiten → nie veraltete Spalten, korrekte
  // Reihenfolge, auch wenn "pokemons" der Liste kurz hinterherhängt.
  const shown = pokemonIds
    .map((id) => pokemons.find((p) => p.id === id))
    .filter(Boolean);

  // Höchstwert je Zeile – nur relevant, wenn mindestens zwei verglichen werden.
  const compareActive = shown.length >= 2;
  const maxima = {};
  if (compareActive) {
    for (const key of [...STAT_ROWS, "total"]) {
      maxima[key] = Math.max(...shown.map((p) => statValue(p, key)));
    }
  }

  // Nur Methoden zeigen, für die mindestens ein Pokémon Attacken hat.
  const methodsWithData = METHOD_ORDER.filter((m) =>
    shown.some((p) => (movesetById[p.id]?.byMethod[m]?.length ?? 0) > 0),
  );

  const gameLabel = versionGroup
    ? VG_TO_GAME_ID[versionGroup]
      ? t(`games.${VG_TO_GAME_ID[versionGroup]}`)
      : prettifyVg(versionGroup)
    : null;

  let content;
  if (!isAuthenticated) {
    content = <p className={styles.info}>{t("comparison.loginPrompt")}</p>;
  } else if (loading) {
    content = <p className={styles.info}>{t("comparison.loading")}</p>;
  } else if (pokemonIds.length === 0) {
    content = <p className={styles.info}>{t("comparison.empty")}</p>;
  } else if (shown.length === 0) {
    content = <p className={styles.info}>{t("comparison.loading")}</p>;
  } else {
    content = (
      <>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.corner} />
                {shown.map((p) => (
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
                  {shown.map((p) => {
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
                {shown.map((p) => {
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
                {shown.map((p) => (
                  <td key={p.id} className={styles.cell}>
                    {p.height / 10} m
                  </td>
                ))}
              </tr>
              <tr>
                <th className={styles.rowHead}>{t("detail.weight")}</th>
                {shown.map((p) => (
                  <td key={p.id} className={styles.cell}>
                    {p.weight / 10} kg
                  </td>
                ))}
              </tr>

              {/* Attacken */}
              <tr>
                <th className={styles.sectionHead} colSpan={shown.length + 1}>
                  {t("comparison.moves")}
                  {gameLabel && (
                    <span className={styles.sectionMeta}> · {gameLabel}</span>
                  )}
                </th>
              </tr>
              {methodsWithData.length === 0 && movesLoading && (
                <tr>
                  <td
                    className={styles.movesLoading}
                    colSpan={shown.length + 1}
                  >
                    {t("comparison.movesLoading")}
                  </td>
                </tr>
              )}
              {methodsWithData.map((method) => {
                const isOpen = openMethods.has(method);
                return (
                  <tr key={method}>
                    <th className={styles.methodHead}>
                      <button
                        type="button"
                        className={styles.methodToggle}
                        onClick={() => toggleMethod(method)}
                        aria-expanded={isOpen}
                      >
                        <span
                          className={styles.chevron}
                          data-open={isOpen}
                          aria-hidden="true"
                        >
                          ▸
                        </span>
                        {t(METHOD_LABEL[method])}
                      </button>
                    </th>
                    {shown.map((p) => {
                      const list = movesetById[p.id]?.byMethod[method] ?? [];
                      return (
                        <td key={p.id} className={styles.moveCell}>
                          {isOpen &&
                            (list.length > 0 ? (
                              <ul className={styles.moveList}>
                                {list.map((mv, i) => {
                                  const type = moveType(mv.slug);
                                  return (
                                    <li
                                      key={`${mv.slug}-${i}`}
                                      className={styles.moveChip}
                                      data-shared={sharedSlugs.has(mv.slug)}
                                      style={{
                                        borderLeftColor:
                                          typeColors[type] ?? "transparent",
                                      }}
                                    >
                                      <span className={styles.moveChipName}>
                                        {moveName(mv.slug, i18n.language)}
                                      </span>
                                      {method === "level-up" &&
                                        mv.level > 0 && (
                                          <span
                                            className={styles.moveChipLevel}
                                          >
                                            {t("common.level", { level: mv.level })}
                                          </span>
                                        )}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <span className={styles.moveDash}>–</span>
                            ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {compareActive && sharedSlugs.size > 0 && (
          <p className={styles.movesLegend}>{t("comparison.sharedLegend")}</p>
        )}
      </>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t("comparison.title")}</h1>
      {content}
    </main>
  );
}
