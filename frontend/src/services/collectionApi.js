import { apiFetch } from "./apiFetch";

export async function getCollection() {
  return apiFetch("/collection"); // Array von { pokemonId, caught, game, ... }
}

// Fangstatus fuer ein Pokemon in einem bestimmten Spiel setzen.
// game ist die Spiel-ID (z. B. "sv"); "all" = ohne Spielwahl.
export async function setCaught(pokemonId, caught, game) {
  return apiFetch("/collection", {
    method: "POST",
    body: JSON.stringify({ pokemonId, caught, game }),
  }); // der aktualisierte Eintrag
}
