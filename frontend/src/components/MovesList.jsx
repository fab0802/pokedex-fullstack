import { useEffect, useLayoutEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollText, ArrowUp, ArrowDown } from "lucide-react";
import { useGame } from "../context/useGame";
import { useMovesList } from "../context/useMovesList";
import { moveName } from "./moveName";
import { typeColors } from "./typeColors";
import {
  getMovesForGame,
  formatMachine,
  filterAndSortMoves,
} from "./movesData";
import MoveCategoryIcon from "./MoveCategoryIcon";
import styles from "./MovesList.module.css";

const TYPES = Object.keys(typeColors);
const CLASSES = ["physical", "special", "status"];

// key = Sortierschlüssel, hideMobile = Spalte unter 600px ausblenden
const COLUMNS = [
  { key: "name", label: "moveGuide.col.name" },
  { key: "type", label: "moveGuide.col.type" },
  { key: "class", label: "moveGuide.col.class" },
  { key: "power", label: "moveGuide.col.power", num: true },
  {
    key: "accuracy",
    label: "moveGuide.col.accuracy",
    num: true,
    hideMobile: true,
  },
  { key: "pp", label: "moveGuide.col.pp", num: true, hideMobile: true },
  {
    key: "tm",
    label: "moveGuide.col.tm",
    num: true,
    hideMobile: true,
    gameOnly: true,
  },
];

export default function MovesList() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { selectedGame } = useGame();
  const hasGame = selectedGame.id !== "all";

  // Filter/Sortierung liegen im Context -> bleiben beim Zurückkommen erhalten
  const { filters, setFilters, sort, setSort, lastVisitedSlugRef } =
    useMovesList();
  const { query, type, category, onlyTm } = filters;
  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // Nur neu berechnen, wenn sich das Spiel ändert
  const allMoves = useMemo(() => getMovesForGame(selectedGame), [selectedGame]);

  const visible = useMemo(
    () => filterAndSortMoves(allMoves, filters, sort, { hasGame, lang }),
    [allMoves, filters, sort, hasGame, lang],
  );

  // Zurück aus der Detailseite: zur zuletzt angesehenen Attacke scrollen.
  // useLayoutEffect läuft vor dem Zeichnen -> kein sichtbarer Sprung.
  // Der Anker wird hier bewusst nicht geleert (StrictMode führt den Effect
  // im Dev doppelt aus), sondern erst beim ersten Scroll unten.
  useLayoutEffect(() => {
    const slug = lastVisitedSlugRef.current;
    if (slug) {
      const row = document.querySelector(`[data-slug="${slug}"]`);
      if (row) {
        row.scrollIntoView({ block: "center" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [lastVisitedSlugRef]);

  useEffect(() => {
    const onScroll = () => {
      lastVisitedSlugRef.current = null;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastVisitedSlugRef]);

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  const columns = COLUMNS.filter((c) => !c.gameOnly || hasGame);
  const dash = <span className={styles.muted}>–</span>;

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <h1 className={styles.title}>
          <ScrollText size={24} aria-hidden="true" />
          {t("moveGuide.title")}
        </h1>
        <span className={styles.meta}>
          {hasGame && `${t(`games.${selectedGame.id}`)} · `}
          {t("moveGuide.count", { count: visible.length })}
        </span>
      </header>

      <div className={styles.controls}>
        <input
          type="search"
          className={styles.search}
          placeholder={t("moveGuide.search")}
          value={query}
          onChange={(e) => setFilter("query", e.target.value)}
          aria-label={t("moveGuide.search")}
        />
        <div className={styles.filters}>
          <select
            value={type}
            onChange={(e) => setFilter("type", e.target.value)}
            aria-label={t("moveGuide.col.type")}
          >
            <option value="">{t("moveGuide.allTypes")}</option>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`types.${ty}`)}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setFilter("category", e.target.value)}
            aria-label={t("moveGuide.col.class")}
          >
            <option value="">{t("moveGuide.allClasses")}</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {t(`moveGuide.class.${c}`)}
              </option>
            ))}
          </select>
          {hasGame && (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={onlyTm}
                onChange={(e) => setFilter("onlyTm", e.target.checked)}
              />
              {t("moveGuide.onlyTm")}
            </label>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>{t("moveGuide.empty")}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`${col.num ? styles.num : ""} ${col.hideMobile ? styles.hideMobile : ""}`}
                      aria-sort={
                        active
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={styles.sortBtn}
                        onClick={() => toggleSort(col.key)}
                      >
                        {t(col.label)}
                        {active &&
                          (sort.dir === "asc" ? (
                            <ArrowUp size={12} aria-hidden="true" />
                          ) : (
                            <ArrowDown size={12} aria-hidden="true" />
                          ))}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((mv) => (
                <tr key={mv.slug} data-slug={mv.slug}>
                  <td>
                    <Link to={`/moves/${mv.slug}`} className={styles.name}>
                      {moveName(mv.slug, lang)}
                    </Link>
                  </td>
                  <td>
                    {mv.type && (
                      <span
                        className={styles.typeBadge}
                        style={{
                          color: typeColors[mv.type],
                          backgroundColor: `${typeColors[mv.type]}22`,
                          borderColor: `${typeColors[mv.type]}55`,
                        }}
                      >
                        {t(`types.${mv.type}`)}
                      </span>
                    )}
                  </td>
                  <td>
                    <MoveCategoryIcon category={mv.class} />
                  </td>
                  <td className={styles.num}>{mv.power ?? dash}</td>
                  <td className={`${styles.num} ${styles.hideMobile}`}>
                    {mv.accuracy ?? dash}
                  </td>
                  <td className={`${styles.num} ${styles.hideMobile}`}>
                    {mv.pp ?? dash}
                  </td>
                  {hasGame && (
                    <td
                      className={`${styles.num} ${styles.hideMobile} ${styles.muted}`}
                    >
                      {formatMachine(mv.tm, lang) ?? "–"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
