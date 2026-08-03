import { BASE_URL } from "./config";
import { authHeaders } from "./authHeaders";

// Zentraler Wrapper für authentifizierte Requests (Teams, Collection, ...).
// Bündelt das wiederkehrende Muster (Header setzen, JSON parsen, Fehler werfen)
// und behandelt 401 einheitlich: Bei abgelaufenem/ungültigem Token wird ein
// globales Event gefeuert, damit die React-Seite zentral ausloggen/umleiten kann.
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
