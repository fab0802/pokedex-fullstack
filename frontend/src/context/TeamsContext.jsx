import { useState, useEffect } from "react";
import { TeamsContext } from "./teamsContextObject";
import { useAuth } from "./useAuth";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../services/teamApi";

const MAX_TEAM_SIZE = 6;

export function TeamsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeams([]);
      return;
    }
    getTeams()
      .then(setTeams)
      .catch((err) => console.error(err));
  }, [isAuthenticated]);

  async function addPokemonToTeam(teamId, pokemonId) {
    const team = teams.find((t) => t._id === teamId);
    if (!team) return;
    const id = Number(pokemonId);
    if (team.pokemonIds.includes(id)) return; // keine Duplikate
    if (team.pokemonIds.length >= MAX_TEAM_SIZE) return; // max. 6
    const updated = await updateTeam(teamId, team.name, [
      ...team.pokemonIds,
      id,
    ]);
    setTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
  }

  async function removePokemonFromTeam(teamId, pokemonId) {
    const team = teams.find((t) => t._id === teamId);
    if (!team) return;
    const id = Number(pokemonId);
    const newIds = team.pokemonIds.filter((pid) => pid !== id);
    const updated = await updateTeam(teamId, team.name, newIds);
    setTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
  }

  async function createTeamWithPokemon(name, pokemonId) {
    const ids = pokemonId ? [Number(pokemonId)] : [];
    const newTeam = await createTeam(name, ids);
    setTeams((prev) => [...prev, newTeam]);
    return newTeam;
  }

  async function removeTeam(teamId) {
    await deleteTeam(teamId);
    setTeams((prev) => prev.filter((t) => t._id !== teamId));
  }

  const value = {
    teams,
    addPokemonToTeam,
    removePokemonFromTeam,
    createTeamWithPokemon,
    removeTeam,
    maxTeamSize: MAX_TEAM_SIZE,
  };

  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  );
}
