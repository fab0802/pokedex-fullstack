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

// Wie viele Karten die aktive (sortierte) Ansicht pro Schritt zeigt. Die Daten
// liegen komplett im Speicher; das hier hält nur das DOM schlank.
const WINDOW_STEP = 20;

function statValue(p, field) {
  if (field === "number") return p.id;
  if (field === "total") return p.stats.reduce((sum, s) => sum + s.value, 0);
  const s = p.stats.find((x) => x.name === field);
  return s ? s.value : 0;
}

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

  // Der Spiel-Filter sitzt jetzt global im Drawer. Wechselt das Spiel, soll
  // die Liste wieder oben starten (der erste Render ändert nichts).
  const prevGameId = useRef(selectedGame.id);
  useEffect(() => {
    if (prevGameId.current === selectedGame.id) return;
    prevGameId.current = selectedGame.id;
    scrollYRef.current = 0;
    window.scrollTo(0, 0);
  }, [selectedGame.id, scrollYRef]);

  // Sobald ein Filter/Sortierung aktiv ist, den ganzen Dex nachladen.
  useEffect(() => {
    if (isActive) loadAll();
  }, [isActive, loadAll]);

  // Bei neuer Sortierung/neuem Spiel das Fenster zurücksetzen (und in der
  // aktiven Ansicht nach oben, weil sich die Reihenfolge komplett ändert).
  useEffect(() => {
    setVisibleCount(WINDOW_STEP);
    if (isActive) window.scrollTo(0, 0);
  }, [sort, isActive, selectedGame.id]);

  // Sortierte Vollansicht ableiten (nur wenn aktiv).
  const sortedView = useMemo(() => {
    if (!isActive) return null;
    return [...allPokemons].sort((a, b) => {
      const primary = statValue(a, sort.field) - statValue(b, sort.field);
      if (primary !== 0) return sort.dir === "asc" ? primary : -primary;
      return a.id - b.id;
    });
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
