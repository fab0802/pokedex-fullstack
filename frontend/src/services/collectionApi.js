import { apiFetch } from "./apiFetch";

export async function getCollection() {
  return apiFetch("/collection"); // Array von { pokemonId, caught, ... }
}

export async function setCaught(pokemonId, caught) {
  return apiFetch("/collection", {
    method: "POST",
    body: JSON.stringify({ pokemonId, caught }),
  }); // der aktualisierte Eintrag
}
