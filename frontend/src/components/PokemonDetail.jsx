import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
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
const MIN_ID = 1;
const MAX_ID = 1025;

export default function PokemonDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState(null);
  const [animate, setAnimate] = useState(false);
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

  // Tastatur-Navigation
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (e.key === "ArrowLeft" && currentId > MIN_ID) {
        navigate(`/pokemon/${currentId - 1}`);
      } else if (e.key === "ArrowRight" && currentId < MAX_ID) {
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
    // nur horizontale Swipes ab 60px werten (vertikales Scrollen ignorieren)
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && currentId < MAX_ID) navigate(`/pokemon/${currentId + 1}`);
    else if (dx > 0 && currentId > MIN_ID)
      navigate(`/pokemon/${currentId - 1}`);
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
        <div className={styles.pager}>
          <button
            className={styles.pagerButton}
            onClick={() => navigate(`/pokemon/${currentId - 1}`)}
            disabled={!hasPrev}
            title={t("detail.prev")}
            aria-label={t("detail.prev")}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className={styles.pagerButton}
            onClick={() => navigate(`/pokemon/${currentId + 1}`)}
            disabled={!hasNext}
            title={t("detail.next")}
            aria-label={t("detail.next")}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

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
    </div>
  );
}
