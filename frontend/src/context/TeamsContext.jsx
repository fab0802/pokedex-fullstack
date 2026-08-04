import { useState, useEffect } from "react";
import { TeamsContext } from "./teamsContextObject";
import { useAuth } from "./useAuth";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  reorderTeams,
} from "../services/teamApi";

const MAX_TEAM_SIZE = 6;

export function TeamsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeams([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getTeams()
      .then(setTeams)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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

  async function movePokemon(teamId, pokemonId, direction) {
    const team = teams.find((t) => t._id === teamId);
    if (!team) return;
    const ids = [...team.pokemonIds];
    const index = ids.indexOf(Number(pokemonId));
    const target = index + direction; // -1 = nach links, +1 = nach rechts
    if (target < 0 || target >= ids.length) return; // Rand erreicht
    [ids[index], ids[target]] = [ids[target], ids[index]]; // tauschen
    const updated = await updateTeam(teamId, team.name, ids);
    setTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
  }

  // Live-Update während des Ziehens – nur lokal, kein API-Call.
  function reorderPokemon(teamId, newIds) {
    setTeams((prev) =>
      prev.map((t) => (t._id === teamId ? { ...t, pokemonIds: newIds } : t)),
    );
  }

  // Neue Reihenfolge speichern (am Ende des Ziehens).
  async function persistPokemonOrder(teamId, teamName, ids) {
    try {
      const updated = await updateTeam(teamId, teamName, ids);
      setTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
    } catch (err) {
      // Bei Fehler den sauberen Server-Stand wiederherstellen.
      const fresh = await getTeams();
      setTeams(fresh);
      throw err;
    }
  }

  // Team per Pfeil verschieben: benachbarte Teams tauschen + speichern.
  async function moveTeam(teamId, direction) {
    const index = teams.findIndex((t) => t._id === teamId);
    const target = index + direction; // -1 = hoch, +1 = runter
    if (index < 0 || target < 0 || target >= teams.length) return; // Rand
    const reordered = [...teams];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    setTeams(reordered); // optimistisch
    try {
      const server = await reorderTeams(reordered.map((t) => t._id));
      setTeams(server);
    } catch (err) {
      setTeams(teams); // zurückrollen auf den Stand vor dem Tausch
      throw err;
    }
  }

  // Live-Update während des Team-Ziehens – nur lokal, kein API-Call.
  function reorderTeamsLive(newTeams) {
    setTeams(newTeams);
  }

  // Neue Team-Reihenfolge speichern (am Ende des Ziehens).
  async function persistTeamsOrder(orderedIds) {
    try {
      const server = await reorderTeams(orderedIds);
      setTeams(server);
    } catch (err) {
      // Bei Fehler den sauberen Server-Stand wiederherstellen.
      const fresh = await getTeams();
      setTeams(fresh);
      throw err;
    }
  }

  const value = {
    teams,
    loading,
    addPokemonToTeam,
    removePokemonFromTeam,
    movePokemon,
    reorderPokemon,
    persistPokemonOrder,
    moveTeam,
    reorderTeamsLive,
    persistTeamsOrder,
    createTeamWithPokemon,
    removeTeam,
    maxTeamSize: MAX_TEAM_SIZE,
  };

  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  );
}
