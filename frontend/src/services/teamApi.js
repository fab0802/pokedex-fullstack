import { BASE_URL } from "./config";
import { authHeaders } from "./authHeaders";

export async function getTeams() {
  const res = await fetch(`${BASE_URL}/teams`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load teams");
  return data; // Array von { _id, name, pokemonIds, ... }
}

export async function createTeam(name, pokemonIds) {
  const res = await fetch(`${BASE_URL}/teams`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, pokemonIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create team");
  return data; // das erstellte Team
}

export async function updateTeam(id, name, pokemonIds) {
  const res = await fetch(`${BASE_URL}/teams/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name, pokemonIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update team");
  return data; // das aktualisierte Team
}

export async function deleteTeam(id) {
  const res = await fetch(`${BASE_URL}/teams/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete team");
  return data;
}
