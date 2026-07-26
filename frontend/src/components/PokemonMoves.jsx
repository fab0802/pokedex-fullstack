import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPokemonMoves } from "../services/pokeApi";
import { useGame } from "../context/useGame";
import { moveName } from "./moveName";
import { VERSION_GROUP_ORDER } from "./games";
import styles from "./PokemonMoves.module.css";

const METHOD_ORDER = ["level-up", "machine", "egg", "tutor"];
const METHOD_LABEL = {
  "level-up": "moves.levelUp",
  machine: "moves.machine",
  egg: "moves.egg",
  tutor: "moves.tutor",
};

// Welche Version-Group zeigen wir? Erst die des gewählten Spiels, sonst die
// neueste, in der das Pokémon überhaupt Moves hat.
function pickVersionGroup(moves, game) {
  const available = new Set();
  for (const m of moves)
    for (const d of m.details) available.add(d.versionGroup);

  for (const vg of game.versionGroups) if (available.has(vg)) return vg;

  let best = null;
  let bestRank = Infinity;
  for (const vg of available) {
    const idx = VERSION_GROUP_ORDER.indexOf(vg);
    const rank = idx === -1 ? Infinity : idx;
    if (rank < bestRank) {
      bestRank = rank;
      best = vg;
    }
  }
  return best ?? [...available][0] ?? null;
}

function buildMoveset(moves, game) {
  if (!moves || moves.length === 0) return null;
  const vg = pickVersionGroup(moves, game);
  if (!vg) return null;

  const byMethod = { "level-up": [], machine: [], egg: [], tutor: [] };
  for (const m of moves) {
    for (const d of m.details) {
      if (d.versionGroup !== vg || !byMethod[d.method]) continue;
      byMethod[d.method].push({ slug: m.slug, level: d.level });
    }
  }
  byMethod["level-up"].sort(
    (a, b) => a.level - b.level || a.slug.localeCompare(b.slug),
  );
  for (const k of ["machine", "egg", "tutor"]) {
    byMethod[k].sort((a, b) => a.slug.localeCompare(b.slug));
  }
  return { versionGroup: vg, byMethod };
}

function prettifyVg(vg) {
  return vg
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function PokemonMoves({ pokemonId }) {
  const { t, i18n } = useTranslation();
  const { selectedGame } = useGame();
  const [result, setResult] = useState(null);
  const [openMethods, setOpenMethods] = useState(() => new Set(["level-up"]));

  function toggleMethod(method) {
    setOpenMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) next.delete(method);
      else next.add(method);
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    fetchPokemonMoves(pokemonId)
      .then((res) => !cancelled && setResult({ pokemonId, moves: res }))
      .catch(() => !cancelled && setResult({ pokemonId, error: true }));
    return () => {
      cancelled = true;
    };
  }, [pokemonId]);

  // Nur verwenden, wenn das Ergebnis zum aktuellen Pokémon gehört
  const current = result && result.pokemonId === pokemonId ? result : null;
  if (current?.error) return <p className={styles.empty}>{t("moves.error")}</p>;
  if (!current) return <p className={styles.empty}>{t("detail.loading")}</p>;

  const moveset = buildMoveset(current.moves, selectedGame);

  return (
    <div>
      <p className={styles.version}>{prettifyVg(moveset.versionGroup)}</p>
      {METHOD_ORDER.map((method) => {
        const list = moveset.byMethod[method];
        if (!list || list.length === 0) return null;
        const isOpen = openMethods.has(method);
        return (
          <div key={method} className={styles.group}>
            <button
              type="button"
              className={styles.groupHeader}
              onClick={() => toggleMethod(method)}
              aria-expanded={isOpen}
            >
              <span className={styles.chevron} aria-hidden="true">
                ▸
              </span>
              {t(METHOD_LABEL[method])} ({list.length})
            </button>
            <div
              className={`${styles.collapsible} ${isOpen ? styles.open : ""}`}
            >
              <div className={styles.collapsibleInner}>
                <ul className={styles.list}>
                  {list.map((mv, i) => (
                    <li key={`${mv.slug}-${i}`} className={styles.item}>
                      <span>{moveName(mv.slug, i18n.language)}</span>
                      {method === "level-up" && mv.level > 0 && (
                        <span className={styles.level}>
                          {t("moves.lv", { level: mv.level })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
