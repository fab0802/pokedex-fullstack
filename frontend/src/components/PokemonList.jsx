import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./PokemonList.module.css";
import { typeColors } from "./typeColors";
import { typeBackgrounds } from "./typeBackgrounds";
import { games } from "./games";
import { useAuth } from "../context/useAuth";
import { useCollection } from "../context/useCollection";
import { usePokemonList } from "../context/usePokemonList";
import { useTranslation } from "react-i18next";
import { pokemonName } from "./pokemonName";

export default function PokemonList() {
  const { t, i18n } = useTranslation();
  const {
    selectedGame,
    setSelectedGame,
    pokemons,
    loading,
    error,
    hasMore,
    loadMore,
    scrollYRef,
  } = usePokemonList();
  const { isAuthenticated } = useAuth();
  const { isCaught, toggleCaught } = useCollection();
  const sentinelRef = useRef(null);

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

  // Infinite Scroll: nachladen, wenn der Sentinel in Sicht kommt
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  function handleToggle(e, id) {
    e.preventDefault();
    e.stopPropagation();
    toggleCaught(id);
  }

  function handleGameChange(e) {
    setSelectedGame(games.find((g) => g.label === e.target.value));
    scrollYRef.current = 0;
    window.scrollTo(0, 0);
  }

  return (
    <div>
      <select
        className={styles.genSelect}
        value={selectedGame.label}
        onChange={handleGameChange}
      >
        {games.map((g) => (
          <option key={g.label} value={g.label}>
            {g.label}
          </option>
        ))}
      </select>

      <ul className={styles.list}>
        {pokemons.map((p) => (
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
      {loading && <p className={styles.loading}>{t("list.loading")}</p>}
    </div>
  );
}
