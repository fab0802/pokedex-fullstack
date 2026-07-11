import { BASE_URL } from "./config";
import { authHeaders } from "./authHeaders";

export async function getCollection() {
  const res = await fetch(`${BASE_URL}/collection`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load collection");
  return data; // Array von { pokemonId, caught, ... }
}

export async function setCaught(pokemonId, caught) {
  const res = await fetch(`${BASE_URL}/collection`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ pokemonId, caught }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update collection");
  return data; // der aktualisierte Eintrag
}
