import { apiFetch } from "./apiFetch";

// Vergleichsliste des eingeloggten Users lesen → { pokemonIds }
export async function getComparison() {
  return apiFetch("/comparison");
}

// Komplette Liste speichern – Hinzufügen, Entfernen, Umsortieren und Leeren
// laufen alle hierüber (der Client hält immer die volle Liste) → { pokemonIds }
export async function saveComparison(pokemonIds) {
  return apiFetch("/comparison", {
    method: "PUT",
    body: JSON.stringify({ pokemonIds }),
  });
}
