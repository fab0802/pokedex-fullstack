import { useState, useEffect, useRef, useMemo } from "react";
import { TeamsContext } from "./teamsContextObject";
import { useAuth } from "./useAuth";
import { useGame } from "./useGame";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  reorderTeams,
} from "../services/teamApi";

const MAX_TEAM_SIZE = 6;

// Spiel-Zuordnung eines Teams; fehlt sie (Alt-Teams), gilt "all".
function teamGame(team) {
  return team.game ?? "all";
}

export function TeamsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { selectedGame } = useGame();
  const gameId = selectedGame?.id ?? "all";

  // Interner Voll-Bestand aller Teams. Nach aussen wird davon nur die fuer das
  // gewaehlte Spiel sichtbare Teilmenge (visibleTeams) als `teams` geliefert.
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modell B: Bei "Alle" alle Teams; bei einem Spiel dessen Teams PLUS die
  // allgemeinen ("all")-Teams, die ueberall mitreisen.
  const visibleTeams = useMemo(() => {
    if (gameId === "all") return allTeams;
    return allTeams.filter((t) => {
      const g = teamGame(t);
      return g === gameId || g === "all";
    });
  }, [allTeams, gameId]);

  // Undo-Verlauf pro Team: { [teamId]: number[][] } – ein Stapel von
  // pokemonIds-Snapshots. Jeder Snapshot ist der Stand VOR einer Änderung.
  const [history, setHistory] = useState({});
  // Merkt sich beim Drag-Start den Vor-Drag-Stand, bis das Ziehen endet.
  const dragSnapshot = useRef(null);

  // Aktuellen Stand eines Teams auf den Undo-Stapel legen.
  function pushHistory(teamId, ids) {
    setHistory((prev) => ({
      ...prev,
      [teamId]: [...(prev[teamId] || []), [...ids]],
    }));
  }

  // Gibt es für dieses Team etwas rückgängig zu machen?
  function canUndo(teamId) {
    return (history[teamId]?.length || 0) > 0;
  }

  // Letzten Snapshot wiederherstellen und speichern.
  async function undoTeamChange(teamId) {
    const stack = history[teamId];
    if (!stack || stack.length === 0) return;
    const previousIds = stack[stack.length - 1];
    const team = allTeams.find((t) => t._id === teamId);
    if (!team) return;
    setHistory((prev) => ({ ...prev, [teamId]: prev[teamId].slice(0, -1) }));
    const updated = await updateTeam(teamId, team.name, previousIds);
    setAllTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
  }

  // Verlauf eines Teams leeren (beim Verlassen des Bearbeiten-Modus).
  function clearHistory(teamId) {
    setHistory((prev) => {
      if (!(teamId in prev)) return prev;
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  }

  // Vor-Drag-Stand merken (onDragStart), damit Umsortieren undo-bar wird.
  function beginPokemonDrag(teamId) {
    const team = allTeams.find((t) => t._id === teamId);
    if (team) dragSnapshot.current = { teamId, ids: [...team.pokemonIds] };
  }

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getTeams()
      .then(setAllTeams)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  async function addPokemonToTeam(teamId, pokemonId) {
    const team = allTeams.find((t) => t._id === teamId);
    if (!team) return;
    const id = Number(pokemonId);
    if (team.pokemonIds.includes(id)) return; // keine Duplikate
    if (team.pokemonIds.length >= MAX_TEAM_SIZE) return; // max. 6
    pushHistory(teamId, team.pokemonIds); // Undo-Snapshot vor der Änderung
    const updated = await updateTeam(teamId, team.name, [
      ...team.pokemonIds,
      id,
    ]);
    setAllTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
  }

  async function removePokemonFromTeam(teamId, pokemonId) {
    const team = allTeams.find((t) => t._id === teamId);
    if (!team) return;
    const id = Number(pokemonId);
    const newIds = team.pokemonIds.filter((pid) => pid !== id);
    // Zugehöriges Moveset mit entfernen, damit es beim Wieder-Hinzufügen
    // nicht unerwartet zurückkommt.
    const nextMovesets = { ...(team.movesets || {}) };
    delete nextMovesets[String(id)];
    pushHistory(teamId, team.pokemonIds); // Undo-Snapshot vor der Änderung
    const updated = await updateTeam(teamId, team.name, newIds, nextMovesets);
    setAllTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
  }

  // Moveset eines Team-Mitglieds setzen (geordnete Liste von Move-Slugs,
  // max. 4). Leeres Moveset wird nicht gespeichert, sondern der Key entfernt.
  async function setMoveset(teamId, pokemonId, moves) {
    const team = allTeams.find((t) => t._id === teamId);
    if (!team) return;
    const key = String(pokemonId);
    const nextMovesets = { ...(team.movesets || {}) };
    if (moves && moves.length > 0) {
      nextMovesets[key] = moves.slice(0, 4);
    } else {
      delete nextMovesets[key];
    }
    const updated = await updateTeam(
      teamId,
      team.name,
      team.pokemonIds,
      nextMovesets,
    );
    setAllTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
  }

  async function createTeamWithPokemon(name, pokemonId) {
    const ids = pokemonId ? [Number(pokemonId)] : [];
    // Neues Team dem aktuell gewaehlten Spiel zuordnen ("all" bei "Alle").
    const newTeam = await createTeam(name, ids, gameId);
    setAllTeams((prev) => [...prev, newTeam]);
    return newTeam;
  }

  async function removeTeam(teamId) {
    await deleteTeam(teamId);
    setAllTeams((prev) => prev.filter((t) => t._id !== teamId));
  }

  async function movePokemon(teamId, pokemonId, direction) {
    const team = allTeams.find((t) => t._id === teamId);
    if (!team) return;
    const ids = [...team.pokemonIds];
    const index = ids.indexOf(Number(pokemonId));
    const target = index + direction; // -1 = nach links, +1 = nach rechts
    if (target < 0 || target >= ids.length) return; // Rand erreicht
    pushHistory(teamId, team.pokemonIds); // Undo-Snapshot vor der Änderung
    [ids[index], ids[target]] = [ids[target], ids[index]]; // tauschen
    const updated = await updateTeam(teamId, team.name, ids);
    setAllTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
  }

  // Live-Update während des Ziehens – nur lokal, kein API-Call.
  function reorderPokemon(teamId, newIds) {
    setAllTeams((prev) =>
      prev.map((t) => (t._id === teamId ? { ...t, pokemonIds: newIds } : t)),
    );
  }

  // Neue Reihenfolge speichern (am Ende des Ziehens).
  async function persistPokemonOrder(teamId, teamName, ids) {
    // Undo-Snapshot: nur sichern, wenn sich die Reihenfolge wirklich geändert hat.
    const snap = dragSnapshot.current;
    dragSnapshot.current = null;
    if (snap && snap.teamId === teamId) {
      const changed =
        snap.ids.length !== ids.length || snap.ids.some((v, i) => v !== ids[i]);
      if (changed) pushHistory(teamId, snap.ids);
    }
    try {
      const updated = await updateTeam(teamId, teamName, ids);
      setAllTeams((prev) => prev.map((t) => (t._id === teamId ? updated : t)));
    } catch (err) {
      // Bei Fehler den sauberen Server-Stand wiederherstellen.
      const fresh = await getTeams();
      setAllTeams(fresh);
      throw err;
    }
  }

  // Sichtbare Teilmenge in die volle Reihenfolge zurueckmischen: ausgeblendete
  // Teams behalten ihren Platz, sichtbare werden an ihren Slots neu verteilt.
  function mergeVisibleOrder(orderedVisibleIds) {
    const visibleIdSet = new Set(orderedVisibleIds);
    let k = 0;
    return allTeams.map((t) =>
      visibleIdSet.has(t._id) ? orderedVisibleIds[k++] : t._id,
    );
  }

  // Team per Pfeil verschieben: benachbarte SICHTBARE Teams tauschen + speichern.
  async function moveTeam(teamId, direction) {
    const vIndex = visibleTeams.findIndex((t) => t._id === teamId);
    const vTarget = vIndex + direction; // -1 = hoch, +1 = runter
    if (vIndex < 0 || vTarget < 0 || vTarget >= visibleTeams.length) return;
    const otherId = visibleTeams[vTarget]._id;
    const full = [...allTeams];
    const i = full.findIndex((t) => t._id === teamId);
    const j = full.findIndex((t) => t._id === otherId);
    if (i < 0 || j < 0) return;
    [full[i], full[j]] = [full[j], full[i]]; // im Voll-Bestand tauschen
    const before = allTeams;
    setAllTeams(full); // optimistisch
    try {
      const server = await reorderTeams(full.map((t) => t._id));
      setAllTeams(server);
    } catch (err) {
      setAllTeams(before); // zurückrollen auf den Stand vor dem Tausch
      throw err;
    }
  }

  // Live-Update während des Team-Ziehens – nur lokal, kein API-Call.
  // newVisible = neu sortierte Teilmenge der aktuell sichtbaren Teams.
  function reorderTeamsLive(newVisible) {
    const visibleIdSet = new Set(newVisible.map((t) => t._id));
    let k = 0;
    const merged = allTeams.map((t) =>
      visibleIdSet.has(t._id) ? newVisible[k++] : t,
    );
    setAllTeams(merged);
  }

  // Neue Team-Reihenfolge speichern (am Ende des Ziehens).
  // orderedIds = sichtbare Teams in neuer Reihenfolge.
  async function persistTeamsOrder(orderedIds) {
    const fullOrder = mergeVisibleOrder(orderedIds);
    try {
      const server = await reorderTeams(fullOrder);
      setAllTeams(server);
    } catch (err) {
      // Bei Fehler den sauberen Server-Stand wiederherstellen.
      const fresh = await getTeams();
      setAllTeams(fresh);
      throw err;
    }
  }

  const value = {
    teams: visibleTeams,
    loading,
    addPokemonToTeam,
    removePokemonFromTeam,
    setMoveset,
    movePokemon,
    reorderPokemon,
    persistPokemonOrder,
    moveTeam,
    reorderTeamsLive,
    persistTeamsOrder,
    createTeamWithPokemon,
    removeTeam,
    undoTeamChange,
    canUndo,
    clearHistory,
    beginPokemonDrag,
    maxTeamSize: MAX_TEAM_SIZE,
  };

  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  );
}
