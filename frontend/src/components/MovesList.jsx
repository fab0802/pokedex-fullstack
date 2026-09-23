import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollText, ArrowUp, ArrowDown } from "lucide-react";
import { useGame } from "../context/useGame";
import { moveName } from "./moveName";
import { typeColors } from "./typeColors";
import { getMovesForGame, formatMachine, sortValue } from "./movesData";
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
  { key: "accuracy", label: "moveGuide.col.accuracy", num: true, hideMobile: true },
  { key: "pp", label: "moveGuide.col.pp", num: true, hideMobile: true },
  { key: "tm", label: "moveGuide.col.tm", num: true, hideMobile: true, gameOnly: true },
];

export default function MovesList() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { selectedGame } = useGame();
  const hasGame = selectedGame.id !== "all";

  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [onlyTm, setOnlyTm] = useState(false);
  const [sort, setSort] = useState({ key: "name", dir: "asc" });

  // Nur neu berechnen, wenn sich das Spiel ändert
  const allMoves = useMemo(() => getMovesForGame(selectedGame), [selectedGame]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allMoves.filter((mv) => {
      if (type && mv.type !== type) return false;
      if (category && mv.class !== category) return false;
      if (hasGame && onlyTm && !mv.tm) return false;
      if (!q) return true;
      // DE und EN durchsuchen, egal welche Sprache aktiv ist
      return (
        moveName(mv.slug, "de").toLowerCase().includes(q) ||
        moveName(mv.slug, "en").toLowerCase().includes(q)
      );
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const va = sortValue(a, sort.key, lang);
      const vb = sortValue(b, sort.key, lang);
      // Leere Werte (z. B. Stärke bei Status-Attacken) immer ans Ende
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp =
        typeof va === "string" ? va.localeCompare(vb, lang) : va - vb;
      return cmp * dir;
    });
  }, [allMoves, query, type, category, onlyTm, hasGame, sort, lang]);

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
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("moveGuide.search")}
        />
        <div className={styles.filters}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
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
            onChange={(e) => setCategory(e.target.value)}
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
                onChange={(e) => setOnlyTm(e.target.checked)}
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
                <tr key={mv.slug}>
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
                    <td className={`${styles.num} ${styles.hideMobile} ${styles.muted}`}>
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
