import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./PokemonList.module.css";
import { typeBannerStyle } from "./typeBannerStyle";
import { typeBackgrounds } from "./typeBackgrounds";
import { useAuth } from "../context/useAuth";
import { useCollection } from "../context/useCollection";
import { usePokemonList } from "../context/usePokemonList";
import { useFilter } from "../context/useFilter";
import { useTranslation } from "react-i18next";
import { pokemonName } from "./pokemonName";
import AddToComparisonButton from "./AddToComparisonButton";
import { useGame } from "../context/useGame";
import { derivePokemonView } from "./pokemonView";
import { useDisplay } from "../context/useDisplay";
import { statValue, statPercent } from "./sortPokemons";
import { Users } from "lucide-react";
import StatIcon from "./StatIcon";
import { useTeams } from "../context/useTeams";

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
    listWindowRef,
  } = usePokemonList();
  const { sort, types, generations, categories, stat, caughtStatus, isActive } =
    useFilter();
  const { statField, layout } = useDisplay();
  const { selectedGame } = useGame();
  const { isAuthenticated } = useAuth();
  const { isCaught, toggleCaught } = useCollection();
  const sentinelRef = useRef(null);
  const { teams } = useTeams();

  const isGrid = layout === "grid";

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
    ? `${selectedGame.id}|${sort.field}|${sort.dir}|${types.join(",")}|${generations.join(",")}|${categories.join(",")}|${stat.field ?? ""}|${stat.min}|${stat.max}|${caughtStatus}`
    : `${selectedGame.id}|default`;

  // Fenstergrösse: beim (Re-)Mount aus dem Context-Ref übernehmen, sofern er
  // zur aktuellen Ansicht gehört. So bleibt die Liste nach dem Zurücknavigieren
  // gleich hoch und die Scroll-Position lässt sich wiederherstellen.
  const [visibleCount, setVisibleCount] = useState(() =>
    listWindowRef.current?.viewKey === viewKey
      ? listWindowRef.current.visibleCount
      : WINDOW_STEP,
  );

  // Wechselt die Ansicht, das Fenster zurücksetzen – im Render statt im
  // Effect, das vermeidet die von React gewarnten Kaskaden-Renders.
  const [prevViewKey, setPrevViewKey] = useState(viewKey);
  if (prevViewKey !== viewKey) {
    setPrevViewKey(viewKey);
    setVisibleCount(WINDOW_STEP);
  }

  // Fenstergrösse laufend im Context-Ref sichern, damit sie den nächsten
  // Remount übersteht (an den viewKey gebunden, sonst würde eine fremde
  // Ansicht die falsche Grösse erben).
  useEffect(() => {
    listWindowRef.current = { viewKey, visibleCount };
  }, [viewKey, visibleCount, listWindowRef]);

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

  // Gefilterte + sortierte Vollansicht ableiten (nur wenn aktiv).
  const activeView = useMemo(() => {
    if (!isActive) return null;
    return derivePokemonView(allPokemons, {
      types,
      generations,
      categories,
      stat,
      caughtStatus,
      isCaught,
      sort,
    });
  }, [
    isActive,
    allPokemons,
    types,
    generations,
    categories,
    stat,
    caughtStatus,
    isCaught,
    sort,
  ]);

  // Was tatsächlich gerendert wird: aktiv = gefiltertes/sortiertes Fenster,
  // sonst die per Infinite-Scroll geladene Teilmenge.
  const items = isActive ? (activeView ?? []).slice(0, visibleCount) : pokemons;

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

  function handleToggle(e, p) {
    e.preventDefault();
    e.stopPropagation();
    toggleCaught(p.id, pokemonName(p, i18n.language));
  }

  const teamsByPokemon = useMemo(() => {
    const map = new Map();
    for (const team of teams) {
      for (const id of team.pokemonIds) {
        const arr = map.get(id) || [];
        arr.push(team.name);
        map.set(id, arr);
      }
    }
    return map;
  }, [teams]);

  // Gemeinsames Team-Badge (oben links auf dem Bild) für beide Ansichten.
  const teamBadge = (p) =>
    teamsByPokemon.get(p.id) && (
      <span
        className={styles.teamBadge}
        aria-label={t("list.inTeam")}
        title={teamsByPokemon.get(p.id).join(", ")}
      >
        <Users size={12} aria-hidden="true" />
        {teamsByPokemon.get(p.id).length > 1 && teamsByPokemon.get(p.id).length}
      </span>
    );

  const typeChips = (p) => (
    <div className={styles.types}>
      {p.types.map((type) => (
        <span key={type} className={styles.type}>
          <img src={typeBackgrounds[type]} alt="" className={styles.typeIcon} />
          {t(`types.${type}`)}
        </span>
      ))}
    </div>
  );

  const catchButton = (p, className) => (
    <button
      type="button"
      className={className}
      data-caught={isCaught(p.id)}
      onClick={(e) => handleToggle(e, p)}
      aria-pressed={isCaught(p.id)}
      aria-label={isCaught(p.id) ? t("common.caught") : t("common.notCaught")}
      title={isCaught(p.id) ? t("common.caught") : t("common.notCaught")}
    >
      <img
        src="/fallback-pokeball.svg"
        alt=""
        aria-hidden="true"
        className={styles.catchIcon}
      />
    </button>
  );

  const statBlock = (p, className) => (
    <div className={className}>
      <div className={styles.statHead}>
        <StatIcon stat={statField} size={16} className={styles.statIcon} />
        <span className={styles.statValue}>{statValue(p, statField)}</span>
      </div>
      <div className={styles.statTrack}>
        <div
          className={styles.statFill}
          style={{ width: `${statPercent(p, statField)}%` }}
        />
      </div>
    </div>
  );

  // Variante A – klassische Zeilen-Karte.
  const renderListCard = (p) => (
    <li key={p.id} className={styles.card}>
      <Link to={`/pokemon/${p.id}`} className={styles.cardLink}>
        <div className={styles.imagePanel} style={typeBannerStyle(p.types)}>
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
          {teamBadge(p)}
        </div>
        <div className={styles.info}>
          <div className={styles.identity}>
            <span className={styles.number}>#{p.id}</span>
            <span className={styles.name}>{pokemonName(p, i18n.language)}</span>
            {typeChips(p)}
          </div>
          {(statField !== "off" || isAuthenticated) && (
            <div className={styles.actions}>
              {statField !== "off" && statBlock(p, styles.stat)}
              {isAuthenticated && catchButton(p, styles.catchToggle)}
              {isAuthenticated && (
                <AddToComparisonButton
                  pokemonId={p.id}
                  pokemonName={pokemonName(p, i18n.language)}
                  compact
                />
              )}
            </div>
          )}
        </div>
      </Link>
    </li>
  );

  // Variante B – kompakte Raster-Karte. Fangstatus und Vergleich liegen als
  // Overlays auf dem Bild, der gewählte Stat sitzt unter den Typen.
  const renderGridCard = (p) => (
    <li key={p.id} className={styles.gridCard}>
      <Link to={`/pokemon/${p.id}`} className={styles.gridLink}>
        <div className={styles.gridBanner} style={typeBannerStyle(p.types)}>
          {teamBadge(p)}
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
          {isAuthenticated && catchButton(p, styles.gridBall)}
          {isAuthenticated && (
            <span className={styles.gridCompare}>
              <AddToComparisonButton
                pokemonId={p.id}
                pokemonName={pokemonName(p, i18n.language)}
                compact
              />
            </span>
          )}
        </div>
        <div className={styles.gridBody}>
          <span className={styles.number}>#{p.id}</span>
          <span className={styles.gridName}>
            {pokemonName(p, i18n.language)}
          </span>
          {typeChips(p)}
          {statField !== "off" && statBlock(p, styles.gridStat)}
        </div>
      </Link>
    </li>
  );

  return (
    <div>
      {isAuthenticated && selectedGame.id === "all" && (
        <p className={styles.gameHint}>{t("common.noGameHint")}</p>
      )}
      {isActive && loadingAll && (
        <p className={styles.loading}>
          {t("sort.loadingDex", {
            loaded: allProgress.loaded,
            total: allProgress.total,
          })}
        </p>
      )}
      <ul className={isGrid ? styles.grid : styles.list}>
        {items.map((p) => (isGrid ? renderGridCard(p) : renderListCard(p)))}
      </ul>

      {isActive && !loadingAll && activeView && activeView.length === 0 && (
        <p className={styles.loading}>{t("filter.noResults")}</p>
      )}
      {error && <p>{error}</p>}
      <div ref={sentinelRef} />
      {!isActive && loading && (
        <p className={styles.loading}>{t("common.loading")}</p>
      )}
    </div>
  );
}
