import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPokemonMoves } from "../services/pokeApi";
import { useGame } from "../context/useGame";
import { moveName } from "./moveName";
import { moveType } from "./moveType";
import { typeColors } from "./typeColors";
import { VG_TO_GAME_ID } from "./games";
import { buildMoveset, prettifyVg } from "./moveset";
import styles from "./PokemonMoves.module.css";

const METHOD_ORDER = ["level-up", "machine", "egg", "tutor"];
const METHOD_LABEL = {
  "level-up": "moves.levelUp",
  machine: "moves.machine",
  egg: "moves.egg",
  tutor: "moves.tutor",
};

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
      <p className={styles.version}>
        {VG_TO_GAME_ID[moveset.versionGroup]
          ? t(`games.${VG_TO_GAME_ID[moveset.versionGroup]}`)
          : prettifyVg(moveset.versionGroup)}
      </p>
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
                  {list.map((mv, i) => {
                    const type = moveType(mv.slug);
                    return (
                      <li key={`${mv.slug}-${i}`} className={styles.item}>
                        <span className={styles.moveInfo}>
                          {type && (
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
                          )}
                          <span>{moveName(mv.slug, i18n.language)}</span>
                        </span>
                        {method === "level-up" && mv.level > 0 && (
                          <span className={styles.level}>
                            {t("moves.lv", { level: mv.level })}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
