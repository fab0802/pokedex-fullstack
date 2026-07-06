import { useEffect, useState } from "react";
import { fetchPokemonList } from "../services/pokeApi";

const LIMIT = 20;

export default function PokemonList() {
  const [pokemons, setPokemons] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMore();
  }, []);

  async function loadMore() {
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
    }
  }

  return (
    <div>
      <ul>
        {pokemons.map((p) => (
          <li key={p.name}>{p.name}</li>
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
