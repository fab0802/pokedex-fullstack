import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { fetchPokemonMoves } from "../services/pokeApi";
import { useGame } from "../context/useGame";
import { useTeams } from "../context/useTeams";
import { games } from "./games";
import { buildMoveset } from "./moveset";
import { moveName } from "./moveName";
import { moveType } from "./moveType";
import { typeColors } from "./typeColors";
import styles from "./MovesetPicker.module.css";

const MAX_MOVES = 4;
const METHOD_ORDER = ["level-up", "machine", "egg", "tutor"];
const METHOD_LABEL = {
  "level-up": "moves.levelUp",
  machine: "moves.machine",
  egg: "moves.egg",
  tutor: "moves.tutor",
};

// Welches Spiel bestimmt die wählbaren Attacken?
// Das Spiel des Teams; ist das Team "all" (oder ohne Spiel), das aktuell
// gewählte Spiel; sonst leeres "all"-Spiel → buildMoveset nimmt die neueste
// Version, in der das Pokémon Attacken hat.
function resolveGame(team, selectedGame) {
  const teamGame = games.find((g) => g.id === (team.game ?? "all")) ?? games[0];
  if (teamGame.id !== "all") return teamGame;
  if (selectedGame && selectedGame.id !== "all") return selectedGame;
  return teamGame;
}

function TypeBadge({ slug }) {
  const { t } = useTranslation();
  const type = moveType(slug);
  if (!type) return null;
  return (
    <span
      className={styles.typeBadge}
      style={{
        color: typeColors[type],
        backgroundColor: `${typeColors[type]}22`,
        borderColor: `${typeColors[type]}55`,
      }}
    >
      {t(`types.${type}`)}
    </span>
  );
}

export default function MovesetPicker({ team, pokemonId, pokemonLabel, onClose }) {
  const { t, i18n } = useTranslation();
  const { selectedGame } = useGame();
  const { setMoveset } = useTeams();
  const panelRef = useRef(null);

  const [moves, setMoves] = useState(null); // rohe Move-Liste | "error" | null
  const [selected, setSelected] = useState(
    () => team.movesets?.[String(pokemonId)] ?? [],
  );
  const [saving, setSaving] = useState(false);

  // Attacken laden.
  useEffect(() => {
    let cancelled = false;
    fetchPokemonMoves(pokemonId)
      .then((res) => !cancelled && setMoves(res))
      .catch(() => !cancelled && setMoves("error"));
    return () => {
      cancelled = true;
    };
  }, [pokemonId]);

  // Hintergrund-Scroll sperren + Escape schliesst.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const gameForMoves = useMemo(
    () => resolveGame(team, selectedGame),
    [team, selectedGame],
  );

  const moveset = useMemo(() => {
    if (!moves || moves === "error") return null;
    return buildMoveset(moves, gameForMoves);
  }, [moves, gameForMoves]);

  function toggleMove(slug) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_MOVES) return prev; // max. 4
      return [...prev, slug];
    });
  }

  function moveSelected(index, direction) {
    const target = index + direction;
    setSelected((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setMoveset(team._id, pokemonId, selected);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isLoading = moves === null;
  const isError = moves === "error";

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("teams.movesetTitle")}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{t("teams.movesetTitle")}</h2>
            {pokemonLabel && <p className={styles.subtitle}>{pokemonLabel}</p>}
          </div>
          <span className={styles.counter}>
            {selected.length} / {MAX_MOVES}
          </span>
        </div>

        {/* Gewählte Attacken (in Slot-Reihenfolge, sortierbar) */}
        <div className={styles.selectedBlock}>
          {selected.length === 0 ? (
            <p className={styles.emptySelected}>{t("teams.noMovesSelected")}</p>
          ) : (
            <ul className={styles.selectedList}>
              {selected.map((slug, index) => (
                <li key={slug} className={styles.selectedItem}>
                  <span className={styles.slotNumber}>{index + 1}</span>
                  <span className={styles.moveInfo}>
                    <TypeBadge slug={slug} />
                    <span>{moveName(slug, i18n.language)}</span>
                  </span>
                  <span className={styles.selectedControls}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => moveSelected(index, -1)}
                      disabled={index === 0}
                      title={t("teams.moveUp")}
                      aria-label={t("teams.moveUp")}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => moveSelected(index, 1)}
                      disabled={index === selected.length - 1}
                      title={t("teams.moveDown")}
                      aria-label={t("teams.moveDown")}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => toggleMove(slug)}
                      title={t("teams.remove")}
                      aria-label={t("teams.remove")}
                    >
                      <X size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Verfügbare Attacken, gruppiert nach Methode */}
        <div className={styles.available}>
          {isLoading && <p className={styles.hint}>{t("common.loading")}</p>}
          {isError && <p className={styles.hint}>{t("moves.error")}</p>}
          {!isLoading && !isError && !moveset && (
            <p className={styles.hint}>{t("moves.none")}</p>
          )}
          {moveset &&
            METHOD_ORDER.map((method) => {
              const list = moveset.byMethod[method];
              if (!list || list.length === 0) return null;
              // Duplikate (gleicher Slug in mehreren Level-Einträgen) meiden.
              const seen = new Set();
              const unique = list.filter((mv) =>
                seen.has(mv.slug) ? false : seen.add(mv.slug),
              );
              return (
                <div key={method} className={styles.group}>
                  <p className={styles.groupLabel}>{t(METHOD_LABEL[method])}</p>
                  {unique.map((mv) => {
                    const isChecked = selected.includes(mv.slug);
                    const disabled = !isChecked && selected.length >= MAX_MOVES;
                    return (
                      <button
                        key={mv.slug}
                        type="button"
                        className={styles.moveRow}
                        onClick={() => toggleMove(mv.slug)}
                        disabled={disabled}
                        aria-pressed={isChecked}
                      >
                        <span
                          className={`${styles.checkbox} ${isChecked ? styles.checked : ""}`}
                          aria-hidden="true"
                        />
                        <span className={styles.moveInfo}>
                          <TypeBadge slug={mv.slug} />
                          <span>{moveName(mv.slug, i18n.language)}</span>
                        </span>
                        {method === "level-up" && mv.level > 0 && (
                          <span className={styles.level}>
                            {t("common.level", { level: mv.level })}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </button>
          <button
            className={styles.save}
            onClick={handleSave}
            disabled={saving}
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
