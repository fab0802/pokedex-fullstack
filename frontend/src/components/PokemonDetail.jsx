import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPokemonById } from "../services/pokeApi";
import { useAuth } from "../context/useAuth";
import { useCollection } from "../context/useCollection";
import { typeColors } from "./typeColors";
import { typeBackgrounds } from "./typeBackgrounds";
import AddToTeamMenu from "./AddToTeamMenu";
import { useTranslation } from "react-i18next";
import { pokemonName } from "./pokemonName";
import styles from "./PokemonDetail.module.css";

const MAX_STAT = 200;

export default function PokemonDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState(null);
  const [animate, setAnimate] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isCaught, toggleCaught } = useCollection();

  useEffect(() => {
    fetchPokemonById(id)
      .then((p) => {
        setPokemon(p);
        requestAnimationFrame(() => setAnimate(true));
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className={styles.message}>{error}</p>;
  if (!pokemon) return <p className={styles.message}>{t("detail.loading")}</p>;

  const typeColor = typeColors[pokemon.types[0]];

  return (
    <div className={styles.wrapper}>
      <div className={styles.banner} style={{ backgroundColor: typeColor }}>
        <img
          src={pokemon.image}
          alt={pokemonName(pokemon, i18n.language)}
          className={styles.image}
          onError={(e) => {
            e.target.src = "/fallback-pokeball.svg";
          }}
        />
        <div className={styles.headerInfo}>
          <span className={styles.number}>#{pokemon.id}</span>
          <span className={styles.name}>
            {pokemonName(pokemon, i18n.language)}
          </span>
          <div className={styles.types}>
            {pokemon.types.map((type) => (
              <span key={type} className={styles.type}>
                <img
                  src={typeBackgrounds[type]}
                  alt=""
                  className={styles.typeIcon}
                />
                {t(`types.${type}`)}
              </span>
            ))}
          </div>
          {isAuthenticated && (
            <button
              className={styles.catchButton}
              onClick={() => toggleCaught(pokemon.id)}
            >
              {isCaught(pokemon.id)
                ? t("detail.caught")
                : t("detail.notCaught")}{" "}
            </button>
          )}
          {isAuthenticated && <AddToTeamMenu pokemonId={pokemon.id} />}
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>{t("detail.height")}:</div>
          <div className={styles.metricValue}>{pokemon.height / 10} m</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>{t("detail.weight")}:</div>
          <div className={styles.metricValue}>{pokemon.weight / 10} kg</div>
        </div>
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.statsTitle}>{t("detail.baseStats")}</h2>
        <div className={styles.stats}>
          {pokemon.stats.map((s) => (
            <div key={s.name} className={styles.statRow}>
              <span className={styles.statLabel}>{t(`stats.${s.name}`)}</span>
              <div className={styles.statTrack}>
                <div
                  key={`${pokemon.id}-${s.name}`}
                  className={styles.statFill}
                  style={{
                    width: animate
                      ? `${Math.min(100, (s.value / MAX_STAT) * 100)}%`
                      : "0%",
                    backgroundColor: typeColor,
                  }}
                />
              </div>
              <span className={styles.statValue}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
