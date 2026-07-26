import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchPokemonEncounters,
  fetchLocalizedNames,
} from "../services/pokeApi";
import { useGame } from "../context/useGame";
import { games, GAMES_WITHOUT_ENCOUNTERS } from "./games";
import styles from "./PokemonLocations.module.css";

function prettifyLocation(slug) {
  return slug
    .replace(/-area$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function locationName(slug, entry, lang) {
  const de = lang && lang.startsWith("de");
  if (entry) {
    const name = de ? entry.de : entry.en;
    if (name) return name;
    if (entry.en) return entry.en;
  }
  return prettifyLocation(slug);
}

// Für ein gewähltes Spiel genau dessen Versionen; bei "Alle" das neueste
// Spiel mit Fundorten. Pro Ort merken wir uns die Versionen (für Exklusivität).
function buildEncounters(encounters, selected) {
  if (!encounters || encounters.length === 0) {
    return { gameId: null, gameVersions: [], locations: [] };
  }
  const available = new Set();
  for (const e of encounters)
    for (const v of e.versions) available.add(v.version);
  const hasMatch = (g) => g.versions.some((v) => available.has(v));

  let game;
  if (selected.id === "all") {
    game = null;
    for (let i = games.length - 1; i >= 0; i--) {
      if (games[i].id === "all") continue;
      if (hasMatch(games[i])) {
        game = games[i];
        break;
      }
    }
  } else {
    game = selected;
  }
  if (!game) return { gameId: null, gameVersions: [], locations: [] };

  const gameVersions = game.versions.filter((v) => available.has(v));
  const versions = new Set(game.versions);
  const locations = [];
  for (const e of encounters) {
    const rel = e.versions.filter((v) => versions.has(v.version));
    if (rel.length === 0) continue;
    locations.push({
      location: e.location,
      min: Math.min(...rel.map((v) => v.min)),
      max: Math.max(...rel.map((v) => v.max)),
      versions: rel.map((v) => v.version),
    });
  }
  locations.sort(
    (a, b) => a.min - b.min || a.location.localeCompare(b.location),
  );
  return { gameId: game.id, gameVersions, locations };
}

export default function PokemonLocations({ pokemonId }) {
  const { t, i18n } = useTranslation();
  const { selectedGame } = useGame();
  const [result, setResult] = useState(null);
  const [names, setNames] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetchPokemonEncounters(pokemonId)
      .then((res) => !cancelled && setResult({ pokemonId, encounters: res }))
      .catch(() => !cancelled && setResult({ pokemonId, error: true }));
    return () => {
      cancelled = true;
    };
  }, [pokemonId]);

  const current = result && result.pokemonId === pokemonId ? result : null;

  const data = useMemo(
    () =>
      current && !current.error
        ? buildEncounters(current.encounters, selectedGame)
        : null,
    [current, selectedGame],
  );

  useEffect(() => {
    if (!data || data.locations.length === 0) return;
    let cancelled = false;
    Promise.all(
      data.locations.map(async (loc) => [
        loc.location,
        await fetchLocalizedNames("location-area", loc.location).catch(
          () => null,
        ),
      ]),
    ).then((entries) => {
      if (cancelled) return;
      setNames((prev) => {
        const next = { ...prev };
        for (const [slug, val] of entries) if (val) next[slug] = val;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (current?.error) {
    return <p className={styles.empty}>{t("locations.error")}</p>;
  }
  if (!current) return <p className={styles.empty}>{t("detail.loading")}</p>;

  // Gen 8/9: PokéAPI hat dafür keine Daten - ehrlich benennen
  if (
    selectedGame.id !== "all" &&
    GAMES_WITHOUT_ENCOUNTERS.has(selectedGame.id)
  ) {
    return <p className={styles.empty}>{t("locations.noData")}</p>;
  }

  if (!data || (!data.gameId && data.locations.length === 0)) {
    return <p className={styles.empty}>{t("locations.noneAnywhere")}</p>;
  }

  const multiVersion = data.gameVersions.length > 1;

  return (
    <div>
      {data.gameId && (
        <p className={styles.version}>{t(`games.${data.gameId}`)}</p>
      )}
      {data.locations.length === 0 ? (
        <p className={styles.empty}>{t("locations.none")}</p>
      ) : (
        <ul className={styles.list}>
          {data.locations.map((loc) => {
            const exclusive =
              multiVersion && loc.versions.length < data.gameVersions.length;
            return (
              <li key={loc.location} className={styles.item}>
                <span className={styles.loc}>
                  {locationName(
                    loc.location,
                    names[loc.location],
                    i18n.language,
                  )}
                  {exclusive && (
                    <span className={styles.exclusive}>
                      {loc.versions.map((v) => t(`versions.${v}`)).join(" / ")}
                    </span>
                  )}
                </span>
                <span className={styles.level}>
                  {loc.min === loc.max
                    ? t("locations.lv", { level: loc.min })
                    : t("locations.lvRange", { min: loc.min, max: loc.max })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
