import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPokemonById, fetchPokedexIds } from "../services/pokeApi";
import styles from "./PokemonList.module.css";
import { typeColors } from "./typeColors";
import { typeBackgrounds } from "./typeBackgrounds";
import { games } from "./games";
import { useAuth } from "../context/useAuth";
import { useCollection } from "../context/useCollection";

const LIMIT = 20;

export default function PokemonList() {
  const [ids, setIds] = useState([]);
  const [pokemons, setPokemons] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(games[0]);
  const isFetchingRef = useRef(false);

  const { isAuthenticated } = useAuth();
  const { isCaught, toggleCaught } = useCollection();

  useEffect(() => {
    let cancelled = false;
    async function setupFilter() {
      setError(null);
      setLoading(true);
      try {
        const list = await fetchPokedexIds(selectedGame.dexes);
        if (cancelled) return;
        setIds(list);
        const firstIds = list.slice(0, LIMIT);
        const details = await Promise.all(
          firstIds.map((id) => fetchPokemonById(id)),
        );
        if (cancelled) return;
        setPokemons(details);
        setLoadedCount(firstIds.length);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setupFilter();
    return () => {
      cancelled = true;
    };
  }, [selectedGame]);

  async function loadMore() {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const nextIds = ids.slice(loadedCount, loadedCount + LIMIT);
      const details = await Promise.all(
        nextIds.map((id) => fetchPokemonById(id)),
      );
      setPokemons((prev) => [...prev, ...details]);
      setLoadedCount((prev) => prev + nextIds.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }

  function handleToggle(e, id) {
    e.preventDefault();
    e.stopPropagation();
    toggleCaught(id);
  }

  const hasMore = loadedCount < ids.length;

  return (
    <div>
      <select
        className={styles.genSelect}
        value={selectedGame.label}
        onChange={(e) =>
          setSelectedGame(games.find((g) => g.label === e.target.value))
        }
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
                  alt={p.name}
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
                  <span className={styles.name}>{p.name}</span>
                  <div className={styles.types}>
                    {p.types.map((type) => (
                      <span key={type} className={styles.type}>
                        <img
                          src={typeBackgrounds[type]}
                          alt=""
                          className={styles.typeIcon}
                        />
                        {type}
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
                      {isCaught(p.id) ? "Caught ✓" : "Not caught"}
                    </button>
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {error && <p>{error}</p>}
      {hasMore && (
        <button onClick={() => loadMore()} disabled={loading}>
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
