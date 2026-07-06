import { useEffect, useRef, useState } from "react";
import { fetchPokemonList } from "../services/pokeApi";
import styles from "./PokemonList.module.css";
import { typeBackgrounds } from "./typeBackgrounds";

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
          <li
            key={p.id}
            className={styles.card}
            style={{ backgroundImage: `url(${typeBackgrounds[p.types[0]]})` }}
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
            <span>
              #{p.id} {p.name}
            </span>
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
