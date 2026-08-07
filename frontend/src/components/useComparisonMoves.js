import { useEffect, useMemo, useState } from "react";
import { fetchPokemonMoves } from "../services/pokeApi";
import { buildMoveset } from "./moveset";

// Lädt die Attacken aller Pokémon der Vergleichsliste, wendet buildMoveset für
// das aktive Spiel an und ermittelt, welche Attacken mehrere teilen.
export function useComparisonMoves(pokemonIds, game) {
  const [rawById, setRawById] = useState({}); // id -> moves | null (Fehler)

  useEffect(() => {
    const missing = pokemonIds.filter((id) => !(id in rawById));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map((id) =>
        fetchPokemonMoves(id)
          .then((moves) => [id, moves])
          .catch(() => [id, null]),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      setRawById((prev) => {
        const next = { ...prev };
        for (const [id, moves] of pairs) next[id] = moves;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pokemonIds, rawById]);

  return useMemo(() => {
    const movesetById = {};
    for (const id of pokemonIds) {
      const raw = rawById[id];
      movesetById[id] = raw ? buildMoveset(raw, game) : null;
    }

    // Ein slug gilt als geteilt, wenn ihn mindestens zwei Pokémon lernen.
    const counts = new Map();
    for (const id of pokemonIds) {
      const ms = movesetById[id];
      if (!ms) continue;
      const slugs = new Set();
      for (const method of Object.keys(ms.byMethod)) {
        for (const mv of ms.byMethod[method]) slugs.add(mv.slug);
      }
      for (const slug of slugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    const sharedSlugs = new Set(
      [...counts.entries()].filter(([, c]) => c >= 2).map(([slug]) => slug),
    );

    // Version-Group für den Hinweis: die des ersten geladenen Pokémon.
    let versionGroup = null;
    for (const id of pokemonIds) {
      if (movesetById[id]) {
        versionGroup = movesetById[id].versionGroup;
        break;
      }
    }

    // Lädt noch, solange für ein Pokémon Rohdaten fehlen (abgeleitet, kein State).
    const loading = pokemonIds.some((id) => !(id in rawById));
    return { movesetById, sharedSlugs, versionGroup, loading };
  }, [pokemonIds, rawById, game]);
}
