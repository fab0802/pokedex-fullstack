import { useState, useRef, useEffect } from "react";
import { PokemonListContext } from "./pokemonListContextObject";
import { fetchPokemonById, fetchPokedexIds } from "../services/pokeApi";
import { games } from "../components/games";

const LIMIT = 20;

export function PokemonListProvider({ children }) {
  const [selectedGame, setSelectedGame] = useState(games[0]);
  const [ids, setIds] = useState([]);
  const [pokemons, setPokemons] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
  const scrollYRef = useRef(0);

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
    if (loadedCount >= ids.length) return;
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

  const value = {
    selectedGame,
    setSelectedGame,
    pokemons,
    loading,
    error,
    hasMore: loadedCount < ids.length,
    loadMore,
    scrollYRef,
  };

  return (
    <PokemonListContext.Provider value={value}>
      {children}
    </PokemonListContext.Provider>
  );
}
