import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPokemonById } from "../services/pokeApi";
import { useAuth } from "../context/useAuth";
import { useCollection } from "../context/useCollection";
import { typeColors } from "./typeColors";
import { typeBackgrounds } from "./typeBackgrounds";
import AddToTeamMenu from "./AddToTeamMenu";
import EvolutionChain from "./EvolutionChain";
import { useTranslation } from "react-i18next";
import { pokemonName } from "./pokemonName";
import styles from "./PokemonDetail.module.css";

const MAX_STAT = 200;
const MIN_ID = 1;
const MAX_ID = 1025;

export default function PokemonDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState(null);
  const [prevPokemon, setPrevPokemon] = useState(null);
  const [nextPokemon, setNextPokemon] = useState(null);
  const [error, setError] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [direction, setDirection] = useState(1);
  const { isAuthenticated } = useAuth();
  const { isCaught, toggleCaught } = useCollection();
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const currentId = Number(id);
  const hasPrev = currentId > MIN_ID;
  const hasNext = currentId < MAX_ID;

  useEffect(() => {
    fetchPokemonById(id)
      .then((p) => {
        setPokemon(p);
        requestAnimationFrame(() => setAnimate(true));
      })
      .catch((err) => setError(err.message));
  }, [id]);

  // Nachbarn (für die Vorschau) laden
  useEffect(() => {
    let cancelled = false;
    async function loadNeighbors() {
      const prev = hasPrev
        ? await fetchPokemonById(currentId - 1).catch(() => null)
        : null;
      if (!cancelled) setPrevPokemon(prev);
      const next = hasNext
        ? await fetchPokemonById(currentId + 1).catch(() => null)
        : null;
      if (!cancelled) setNextPokemon(next);
    }
    loadNeighbors();
    return () => {
      cancelled = true;
    };
  }, [currentId, hasPrev, hasNext]);

  function go(targetId, dir) {
    setDirection(dir);
    navigate(`/pokemon/${targetId}`);
  }

  // Tastatur-Navigation
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (e.key === "ArrowLeft" && currentId > MIN_ID) {
        setDirection(-1);
        navigate(`/pokemon/${currentId - 1}`);
      } else if (e.key === "ArrowRight" && currentId < MAX_ID) {
        setDirection(1);
        navigate(`/pokemon/${currentId + 1}`);
      } else if (e.key === "Escape") {
        navigate("/");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentId, navigate]);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && currentId < MAX_ID) go(currentId + 1, 1);
    else if (dx > 0 && currentId > MIN_ID) go(currentId - 1, -1);
  }

  if (error) return <p className={styles.message}>{error}</p>;
  if (!pokemon) return <p className={styles.message}>{t("detail.loading")}</p>;

  const typeColor = typeColors[pokemon.types[0]];

  return (
    <div
      className={styles.wrapper}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={styles.topNav}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          <ArrowLeft size={16} />
          {t("detail.back")}
        </button>
      </div>

      <div className={styles.pager}>
        {prevPokemon ? (
          <button
            className={styles.preview}
            onClick={() => go(currentId - 1, -1)}
            title={t("detail.prev")}
          >
            <ChevronLeft size={18} />
            <img src={prevPokemon.image} alt="" className={styles.previewImg} />
            <span className={styles.previewText}>
              <span className={styles.previewNum}>#{prevPokemon.id}</span>
              <span className={styles.previewName}>
                {pokemonName(prevPokemon, i18n.language)}
              </span>
            </span>
          </button>
        ) : (
          <span />
        )}
        {nextPokemon ? (
          <button
            className={`${styles.preview} ${styles.previewRight}`}
            onClick={() => go(currentId + 1, 1)}
            title={t("detail.next")}
          >
            <span className={styles.previewText}>
              <span className={styles.previewNum}>#{nextPokemon.id}</span>
              <span className={styles.previewName}>
                {pokemonName(nextPokemon, i18n.language)}
              </span>
            </span>
            <img src={nextPokemon.image} alt="" className={styles.previewImg} />
            <ChevronRight size={18} />
          </button>
        ) : (
          <span />
        )}
      </div>

      <motion.div
        key={pokemon.id}
        initial={{ opacity: 0, x: direction * 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
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
                  : t("detail.notCaught")}
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

        <EvolutionChain
          chainUrl={pokemon.evolutionChainUrl}
          currentId={pokemon.id}
        />
      </motion.div>
    </div>
  );
}
