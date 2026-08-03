import { apiFetch } from "./apiFetch";

export async function getTeams() {
  return apiFetch("/teams"); // Array von { _id, name, pokemonIds, ... }
}

export async function createTeam(name, pokemonIds) {
  return apiFetch("/teams", {
    method: "POST",
    body: JSON.stringify({ name, pokemonIds }),
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
