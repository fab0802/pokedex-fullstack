import { useState, useEffect } from "react";
import { ComparisonContext } from "./comparisonContextObject";
import { useAuth } from "./useAuth";
import { getComparison, saveComparison } from "../services/comparisonApi";

export function ComparisonProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [pokemonIds, setPokemonIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPokemonIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getComparison()
      .then((data) => setPokemonIds(data.pokemonIds))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Neue Liste optimistisch setzen und speichern; bei Fehler zurückrollen.
  async function persist(newIds) {
    const previous = pokemonIds;
    setPokemonIds(newIds);
    try {
      const data = await saveComparison(newIds);
      setPokemonIds(data.pokemonIds); // sauberer Server-Stand
    } catch (err) {
      setPokemonIds(previous); // zurückrollen
      throw err;
    }
  }

  function isInComparison(pokemonId) {
    return pokemonIds.includes(Number(pokemonId));
  }

  async function addToComparison(pokemonId) {
    const id = Number(pokemonId);
    if (pokemonIds.includes(id)) return; // keine Duplikate
    await persist([...pokemonIds, id]);
  }

  async function removeFromComparison(pokemonId) {
    const id = Number(pokemonId);
    await persist(pokemonIds.filter((pid) => pid !== id));
  }

  async function reorderComparison(newIds) {
    await persist(newIds);
  }

  async function clearComparison() {
    await persist([]);
  }

  const value = {
    pokemonIds,
    loading,
    count: pokemonIds.length,
    isInComparison,
    addToComparison,
    removeFromComparison,
    reorderComparison,
    clearComparison,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}
