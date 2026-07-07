import { useEffect, useRef, useState } from "react";
import { fetchPokemonList } from "../services/pokeApi";
import styles from "./PokemonList.module.css";
import { typeBackgrounds } from "./typeBackgrounds";
import { Link } from "react-router-dom";

const LIMIT = 20;

export default function PokemonList() {
  const [pokemons, setPokemons] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (isFetchingRef.current) return; // verhindert Doppel-Aufruf
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPokemonList(LIMIT, offset);
      setPokemons((prev) => [...prev, ...data.results]);
      setHasMore(data.next !== null);
      setOffset((prev) => prev + LIMIT);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }

  return (
    <div>
      <ul className={styles.list}>
        {pokemons.map((p) => (
          <li key={p.id} className={styles.card}>
            <Link to={`/pokemon/${p.id}`} className={styles.cardLink}>
              <div
                className={styles.imagePanel}
                style={{
                  backgroundImage: `url(${typeBackgrounds[p.types[0]]})`,
                }}
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
                <span className={styles.number}>#{p.id}</span>
                <span className={styles.name}>{p.name}</span>
                <div className={styles.types}>
                  {p.types.map((type) => (
                    <span key={type} className={styles.type}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {error && <p>{error}</p>}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? "Lädt..." : "Mehr laden"}
        </button>
      )}
    </div>
  );
}
