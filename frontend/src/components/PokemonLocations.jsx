import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchPokemonEncounters,
  fetchLocalizedNames,
} from "../services/pokeApi";
import {
  hasLocalEncounters,
  fetchLocalEncounters,
} from "../services/localEncounters";
import { useGame } from "../context/useGame";
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

  const gameId = selectedGame.id;
  const local = hasLocalEncounters(gameId);

  // Quelle je nach Spiel: PokéAPI (Gen 1–7) oder lokale JSON (Gen 8/9).
  // Bei lokalen Spielen kommen die Ortsnamen direkt mit, daher setzen wir
  // names hier gleich mit und sparen uns die PokéAPI-Lokalisierung unten.
  useEffect(() => {
    let cancelled = false;
    if (local) {
      fetchLocalEncounters(gameId, pokemonId)
        .then(({ encounters, names: localNames }) => {
          if (cancelled) return;
          setResult({ pokemonId, gameId, encounters });
          setNames(localNames);
        })
        .catch(
          () => !cancelled && setResult({ pokemonId, gameId, error: true }),
        );
    } else {
      fetchPokemonEncounters(pokemonId)
        .then(
          (res) =>
            !cancelled && setResult({ pokemonId, gameId, encounters: res }),
        )
        .catch(
          () => !cancelled && setResult({ pokemonId, gameId, error: true }),
        );
    }
    return () => {
      cancelled = true;
    };
  }, [pokemonId, gameId, local]);

  const current =
    result && result.pokemonId === pokemonId && result.gameId === gameId
      ? result
      : null;

  // Fundorte immer für das global gewählte Spiel. Ohne Spielwahl ("all")
  // gibt es keinen spielspezifischen Inhalt.
  const data = useMemo(
    () =>
      current && !current.error && selectedGame.id !== "all"
        ? buildEncounters(current.encounters, selectedGame)
        : null,
    [current, selectedGame],
  );

  useEffect(() => {
    // Lokale Spiele bringen ihre Namen selbst mit – keine PokéAPI-Abfrage.
    if (local || !data || data.locations.length === 0) return;
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
  }, [data, local]);

  if (current?.error) {
    return <p className={styles.empty}>{t("locations.error")}</p>;
  }
  if (!current) return <p className={styles.empty}>{t("common.loading")}</p>;

  // Ohne gewähltes Spiel: Hinweis statt Fundorte.
  if (selectedGame.id === "all") {
    return <p className={styles.empty}>{t("locations.selectGame")}</p>;
  }

  if (!data || data.locations.length === 0) {
    return <p className={styles.empty}>{t("locations.none")}</p>;
  }

  const multiVersion = data.gameVersions.length > 1;

  return (
    <ul className={styles.list}>
      {data.locations.map((loc) => {
        const exclusive =
          multiVersion && loc.versions.length < data.gameVersions.length;
        return (
          <li key={loc.location} className={styles.item}>
            <span className={styles.loc}>
              {locationName(loc.location, names[loc.location], i18n.language)}
              {exclusive && (
                <span className={styles.exclusive}>
                  {loc.versions.map((v) => t(`versions.${v}`)).join(" / ")}
                </span>
              )}
            </span>
            <span className={styles.level}>
              {loc.min === loc.max
                ? t("common.level", { level: loc.min })
                : t("locations.lvRange", { min: loc.min, max: loc.max })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
