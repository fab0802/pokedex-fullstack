import { apiFetch } from "./apiFetch";

// Beim Login starten mehrere Contexts (Theme, Ball, Display, Game) gleichzeitig
// einen Abruf. Damit daraus nicht mehrere identische GETs werden, teilen sich
// alle Aufrufer denselben laufenden Request (In-Flight-Dedup). Nach Abschluss
// wird zurueckgesetzt, damit ein spaeterer Login frische Daten holt.
let inflight = null;

export function getSettings() {
  if (!inflight) {
    inflight = apiFetch("/settings").finally(() => {
      inflight = null;
    });
  }
  return inflight; // { theme, ball, displayStat, layout, game }
}

// Liest die aktuell im localStorage gesetzten Gast-Einstellungen aus.
// Nur vorhandene Keys werden aufgenommen -> ein frischer Gast liefert {}.
// Wird bei der Registrierung mitgeschickt, damit die Gast-Wahl erhalten bleibt.
export function readLocalSettings() {
  const keys = ["theme", "ball", "displayStat", "layout", "game"];
  const out = {};
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) out[key] = value;
  }
  return out;
}

// Teil-Update: nur die geaenderten Felder mitschicken, z. B. { theme: "dark" }.
export function updateSettings(partial) {
  return apiFetch("/settings", {
    method: "PUT",
    body: JSON.stringify(partial),
  }); // die aktualisierten Einstellungen
}
