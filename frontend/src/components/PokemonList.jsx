import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./PokemonList.module.css";
import { typeColors } from "./typeColors";
import { typeBackgrounds } from "./typeBackgrounds";
import { useAuth } from "../context/useAuth";
import { useCollection } from "../context/useCollection";
import { usePokemonList } from "../context/usePokemonList";
import { useFilter } from "../context/useFilter";
import { useTranslation } from "react-i18next";
import { pokemonName } from "./pokemonName";
import { useGame } from "../context/useGame";
import { comparePokemon } from "./sortPokemons";

// Wie viele Karten die aktive (sortierte) Ansicht pro Schritt zeigt. Die Daten
// liegen komplett im Speicher; das hier hält nur das DOM schlank.
const WINDOW_STEP = 20;

export default function PokemonList() {
  const { t, i18n } = useTranslation();
  const {
    pokemons,
    loading,
    error,
    hasMore,
    loadMore,
    scrollYRef,
    allPokemons,
    loadingAll,
    allProgress,
    loadAll,
  } = usePokemonList();
  const { sort, isActive } = useFilter();
  const { selectedGame } = useGame();
  const { isAuthenticated } = useAuth();
  const { isCaught, toggleCaught } = useCollection();
  const sentinelRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(WINDOW_STEP);

  // Scroll-Position beim Zurückkommen wiederherstellen
  useLayoutEffect(() => {
    window.scrollTo(0, scrollYRef.current);
  }, [scrollYRef]);

  // Aktuelle Scroll-Position laufend merken
  useEffect(() => {
    const onScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollYRef]);

  // Ansichts-Schlüssel: Spiel + (bei aktiver Sortierung) Feld/Richtung.
  const viewKey = isActive
    ? `${selectedGame.id}|${sort.field}|${sort.dir}`
    : `${selectedGame.id}|default`;

  // Wechselt die Ansicht, das Fenster zurücksetzen – im Render statt im
  // Effect, das vermeidet die von React gewarnten Kaskaden-Renders.
  const [prevViewKey, setPrevViewKey] = useState(viewKey);
  if (prevViewKey !== viewKey) {
    setPrevViewKey(viewKey);
    setVisibleCount(WINDOW_STEP);
  }

  // Nach einem Ansichtswechsel nach oben scrollen (echter Seiteneffekt). Der
  // Ref-Vergleich überspringt den ersten Lauf, damit die gespeicherte
  // Scroll-Position beim Zurückkommen erhalten bleibt.
  const lastViewKeyRef = useRef(viewKey);
  useEffect(() => {
    if (lastViewKeyRef.current === viewKey) return;
    lastViewKeyRef.current = viewKey;
    scrollYRef.current = 0;
    window.scrollTo(0, 0);
  }, [viewKey, scrollYRef]);

  // Sobald ein Filter/Sortierung aktiv ist, den ganzen Dex nachladen.
  useEffect(() => {
    if (isActive) loadAll();
  }, [isActive, loadAll]);

  // Sortierte Vollansicht ableiten (nur wenn aktiv).
  const sortedView = useMemo(() => {
    if (!isActive) return null;
    return [...allPokemons].sort(comparePokemon(sort));
  }, [isActive, allPokemons, sort]);

  // Was tatsächlich gerendert wird: aktiv = sortiertes Fenster, sonst die
  // per Infinite-Scroll geladene Teilmenge.
  const items = isActive ? (sortedView ?? []).slice(0, visibleCount) : pokemons;

  // Sentinel: aktiv erweitert das Fenster, sonst lädt es die nächste Seite.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (isActive) {
          setVisibleCount((c) => c + WINDOW_STEP);
        } else if (hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isActive, hasMore, loading, loadMore]);

  function handleToggle(e, id) {
    e.preventDefault();
    e.stopPropagation();
    toggleCaught(id);
  }

  return (
    <div>
      {isActive && loadingAll && (
        <p className={styles.loading}>
          {t("sort.loadingDex", {
            loaded: allProgress.loaded,
            total: allProgress.total,
          })}
        </p>
      )}
      <ul className={styles.list}>
        {items.map((p) => (
          <li key={p.id} className={styles.card}>
            <Link to={`/pokemon/${p.id}`} className={styles.cardLink}>
              <div
                className={styles.imagePanel}
                style={{ backgroundColor: typeColors[p.types[0]] }}
              >
                <img
                  src={p.image}
                  alt={pokemonName(p, i18n.language)}
                  height={96}
                  width={96}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "/fallback-pokeball.svg";
                  }}
                />
              </div>
              <div className={styles.info}>
                <div className={styles.identity}>
                  <span className={styles.number}>#{p.id}</span>
                  <span className={styles.name}>
                    {pokemonName(p, i18n.language)}
                  </span>
                  <div className={styles.types}>
                    {p.types.map((type) => (
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
                </div>
                {isAuthenticated && (
                  <div className={styles.actions}>
                    <button
                      className={styles.catchButton}
                      onClick={(e) => handleToggle(e, p.id)}
                    >
                      {isCaught(p.id) ? t("list.caught") : t("list.notCaught")}
                    </button>
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {error && <p>{error}</p>}
      <div ref={sentinelRef} />
      {!isActive && loading && (
        <p className={styles.loading}>{t("list.loading")}</p>
      )}
    </div>
  );
}
