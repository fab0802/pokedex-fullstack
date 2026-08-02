import { useState, useRef, useEffect, useCallback } from "react";
import { PokemonListContext } from "./pokemonListContextObject";
import { fetchPokemonById, fetchPokedexIds } from "../services/pokeApi";
import { useGame } from "./useGame";

const LIMIT = 20;
// Gleichzeitige Detail-Abrufe beim Voll-Load. Höher = schneller, aber mehr
// Last auf die PokéAPI (jeder Abruf = 2 Requests). Gecachte IDs sind gratis.
const ALL_CONCURRENCY = 20;

export function PokemonListProvider({ children }) {
  const { selectedGame } = useGame();
  const [ids, setIds] = useState([]);
  const [pokemons, setPokemons] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
  const scrollYRef = useRef(0);

  // Voll-Load: alle Details des aktuellen Dex, für Filter/Sortierung.
  const [allPokemons, setAllPokemons] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allProgress, setAllProgress] = useState({ loaded: 0, total: 0 });
  const isLoadingAllRef = useRef(false);
  const allLoadedForRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function setupFilter() {
      setError(null);
      setLoading(true);
      // Voll-Load gehört zum alten Spiel -> beim Wechsel verwerfen.
      setAllPokemons([]);
      setAllProgress({ loaded: 0, total: 0 });
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

  // Lädt die Details ALLER Dex-IDs (für Filter/Sortierung), gedrosselt über
  // mehrere Worker. Läuft nur einmal pro Dex; gecachte IDs sind sofort da.
  const loadAll = useCallback(async () => {
    if (isLoadingAllRef.current) return;
    if (!ids.length) return;
    if (allLoadedForRef.current === ids) return;

    isLoadingAllRef.current = true;
    setLoadingAll(true);
    setAllProgress({ loaded: 0, total: ids.length });

    const queue = [...ids];
    const results = [];
    let loaded = 0;

    async function worker() {
      while (queue.length) {
        const id = queue.shift();
        try {
          results.push(await fetchPokemonById(id));
        } catch {
          // Einzelnes Pokémon überspringen, der Rest lädt weiter.
        }
        loaded++;
        // Fortschritt gedrosselt melden, sonst rendert der Kontext zu oft.
        if (loaded % 25 === 0 || loaded === ids.length) {
          setAllProgress({ loaded, total: ids.length });
        }
      }
    }

    await Promise.all(Array.from({ length: ALL_CONCURRENCY }, worker));

    results.sort((a, b) => a.id - b.id);
    allLoadedForRef.current = ids;
    setAllPokemons(results);
    setLoadingAll(false);
    isLoadingAllRef.current = false;
  }, [ids]);

  const value = {
    pokemons,
    ids,
    loading,
    error,
    hasMore: loadedCount < ids.length,
    loadMore,
    scrollYRef,
    allPokemons,
    loadingAll,
    allProgress,
    loadAll,
  };

  return (
    <PokemonListContext.Provider value={value}>
      {children}
    </PokemonListContext.Provider>
  );
}
