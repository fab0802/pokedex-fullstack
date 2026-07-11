import { useEffect, useRef, useState } from "react";
import { fetchPokemonList } from "../services/pokeApi";
import { typeBackgrounds } from "./typeBackgrounds";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useCollection } from "../context/useCollection";
import { useTeamBuilder } from "../context/useTeamBuilder";
import TeamBar from "./TeamBar";
import styles from "./PokemonList.module.css";
import { typeColors } from "./typeColors";
import { generations } from "./generations";

const LIMIT = 20;

export default function PokemonList() {
  const [pokemons, setPokemons] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
  const { isAuthenticated } = useAuth();
  const { isCaught, toggleCaught } = useCollection();
  const { isInTeam, addToTeam, removeFromTeam, isFull } = useTeamBuilder();
  const [selectedGen, setSelectedGen] = useState(generations[0]);

  useEffect(() => {
    loadMore(selectedGen.start - 1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGen]);

  async function loadMore(currentOffset = offset, replace = false) {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const remaining = selectedGen.end - currentOffset;
      const limit = Math.min(LIMIT, remaining);
      if (limit <= 0) {
        setHasMore(false);
        return;
      }
      const data = await fetchPokemonList(limit, currentOffset);
      setPokemons((prev) =>
        replace ? data.results : [...prev, ...data.results],
      );
      const newOffset = currentOffset + limit;
      setOffset(newOffset);
      setHasMore(newOffset < selectedGen.end && data.next !== null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }

  function handleToggle(e, id) {
    e.preventDefault(); // verhindert die Navigation des Links
    e.stopPropagation();
    toggleCaught(id);
  }

  function handleTeamToggle(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (isInTeam(id)) removeFromTeam(id);
    else addToTeam(id);
  }

  return (
    <div>
      <select
        className={styles.genSelect}
        value={selectedGen.label}
        onChange={(e) =>
          setSelectedGen(generations.find((g) => g.label === e.target.value))
        }
      >
        {generations.map((g) => (
          <option key={g.label} value={g.label}>
            {g.label}
          </option>
        ))}
      </select>
      {isAuthenticated && <TeamBar />}
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
                    <button
                      className={styles.teamButton}
                      onClick={(e) => handleTeamToggle(e, p.id)}
                      disabled={!isInTeam(p.id) && isFull}
                    >
                      {isInTeam(p.id) ? "In team ✓" : "+ Add to team"}
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
