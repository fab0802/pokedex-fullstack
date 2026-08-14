import { apiFetch } from "./apiFetch";

export async function getTeams() {
  return apiFetch("/teams"); // Array von { _id, name, game, pokemonIds, ... }
}

export async function createTeam(name, pokemonIds, game) {
  return apiFetch("/teams", {
    method: "POST",
    body: JSON.stringify({ name, pokemonIds, game }),
  }); // das erstellte Team
}

export async function updateTeam(id, name, pokemonIds) {
  return apiFetch(`/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, pokemonIds }),
  }); // das aktualisierte Team
}

export async function deleteTeam(id) {
  return apiFetch(`/teams/${id}`, { method: "DELETE" });
}

export async function reorderTeams(orderedIds) {
  return apiFetch("/teams/reorder", {
    method: "PUT",
    body: JSON.stringify({ orderedIds }),
  }); // die neu sortierte Team-Liste
}
