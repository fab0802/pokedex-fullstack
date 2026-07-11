import { useState } from "react";
import { TeamBuilderContext } from "./teamBuilderContextObject";
import { createTeam, updateTeam } from "../services/teamApi";

const MAX_TEAM_SIZE = 6;

export function TeamBuilderProvider({ children }) {
  const [name, setName] = useState("");
  const [pokemonIds, setPokemonIds] = useState([]);
  const [editingTeamId, setEditingTeamId] = useState(null);

  function isInTeam(id) {
    return pokemonIds.includes(Number(id));
  }

  function addToTeam(id) {
    const numId = Number(id);
    if (pokemonIds.includes(numId)) return; // keine Duplikate
    if (pokemonIds.length >= MAX_TEAM_SIZE) return; // max. 6
    setPokemonIds((prev) => [...prev, numId]);
  }

  function removeFromTeam(id) {
    const numId = Number(id);
    setPokemonIds((prev) => prev.filter((pid) => pid !== numId));
  }

  function clearTeam() {
    setName("");
    setPokemonIds([]);
    setEditingTeamId(null);
  }

  async function saveTeam() {
    if (editingTeamId) {
      return updateTeam(editingTeamId, name, pokemonIds);
    }
    return createTeam(name, pokemonIds);
  }

  const value = {
    name,
    setName,
    pokemonIds,
    isInTeam,
    addToTeam,
    removeFromTeam,
    clearTeam,
    saveTeam,
    isFull: pokemonIds.length >= MAX_TEAM_SIZE,
    maxTeamSize: MAX_TEAM_SIZE,
  };

  return (
    <TeamBuilderContext.Provider value={value}>
      {children}
    </TeamBuilderContext.Provider>
  );
}
