import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchPokemonEncounters,
  fetchLocalizedNames,
} from "../services/pokeApi";
import { useGame } from "../context/useGame";
import { games } from "./games";
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

// Alle Spiele (ausser "Alle"), in denen dieses Pokémon tatsächlich Fundorte
// hat - in chronologischer Reihenfolge (games ist alt -> neu geordnet).
function availableGamesFor(encounters) {
  if (!encounters || encounters.length === 0) return [];
  const available = new Set();
  for (const e of encounters)
    for (const v of e.versions) available.add(v.version);
  return games.filter(
    (g) => g.id !== "all" && g.versions.some((v) => available.has(v)),
  );
}

// Fundorte für genau ein Spiel aufbereiten. Pro Ort merken wir uns die
// Versionen (für die Exklusiv-Kennzeichnung bei Mehr-Versionen-Spielen).
function buildEncounters(encounters, game) {
  if (!encounters || !game) return { gameVersions: [], locations: [] };

  const available = new Set();
  for (const e of encounters)
    for (const v of e.versions) available.add(v.version);

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
  return { gameVersions, locations };
}

export default function PokemonLocations({ pokemonId }) {
  const { t, i18n } = useTranslation();
  const { selectedGame } = useGame();
  const [result, setResult] = useState(null);
  const [names, setNames] = useState({});
  const [activeGameId, setActiveGameId] = useState(null);

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

  const availableGames = useMemo(
    () =>
      current && !current.error ? availableGamesFor(current.encounters) : [],
    [current],
  );

  // Standard-Spiel wählen: das global gewählte (falls es Fundorte hat),
  // sonst das neuste verfügbare. Bei Pokémon-Wechsel neu bestimmt.
  useEffect(() => {
    if (availableGames.length === 0) {
      setActiveGameId(null);
      return;
    }
    const ids = availableGames.map((g) => g.id);
    const preferred =
      selectedGame.id !== "all" && ids.includes(selectedGame.id)
        ? selectedGame.id
        : ids[ids.length - 1];
    setActiveGameId((prev) => (prev && ids.includes(prev) ? prev : preferred));
  }, [availableGames, selectedGame]);

  const activeGame = useMemo(
    () => availableGames.find((g) => g.id === activeGameId) || null,
    [availableGames, activeGameId],
  );

  const data = useMemo(
    () =>
      current && activeGame
        ? buildEncounters(current.encounters, activeGame)
        : null,
    [current, activeGame],
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

  // Keine Fundort-Daten in irgendeinem Spiel (z. B. nur Gen 8/9 -> PokéAPI leer)
  if (availableGames.length === 0) {
    return <p className={styles.empty}>{t("locations.noneAnywhere")}</p>;
  }

  const multiVersion = data && data.gameVersions.length > 1;

  return (
    <div>
      <div
        className={styles.switcher}
        role="group"
        aria-label={t("locations.gameSwitcher")}
      >
        {availableGames.map((g) => {
          const active = g.id === activeGameId;
          return (
            <button
              key={g.id}
              type="button"
              className={`${styles.chip} ${active ? styles.chipActive : ""}`}
              aria-pressed={active}
              onClick={() => setActiveGameId(g.id)}
            >
              {t(`games.${g.id}`)}
            </button>
          );
        })}
      </div>

      {!data || data.locations.length === 0 ? (
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
