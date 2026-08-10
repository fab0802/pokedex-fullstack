import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, ChevronRight } from "lucide-react";
import { fetchPokemonById, fetchTypeEffectiveness } from "../services/pokeApi";
import { pokemonName } from "./pokemonName";
import { typeColors } from "./typeColors";
import styles from "./GuidePokemonRow.module.css";

// Nur die super-effektiven Angriffstypen (×2/×4) rausziehen - das ist die
// handlungsleitende "das bring ich mit"-Info gegen dieses Pokémon. Die volle
// Tabelle (inkl. Resistenzen) steckt auf der verlinkten Detailseite.
function superEffective(groups) {
  const out = [];
  for (const group of groups) {
    if (group.factor === 4 || group.factor === 2) {
      for (const type of group.types) out.push({ type, factor: group.factor });
    }
  }
  // ×4 vor ×2
  return out.sort((a, b) => b.factor - a.factor);
}

export default function GuidePokemonRow({ id, level, ace = false, nameOverride = null }) {
  const { t, i18n } = useTranslation();
  const [pokemon, setPokemon] = useState(null);
  const [weak, setWeak] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchPokemonById(id)
      .then((p) => {
        if (cancelled) return;
        setPokemon(p);
        return fetchTypeEffectiveness(p.types);
      })
      .then((groups) => {
        if (!cancelled && groups) setWeak(superEffective(groups));
      })
      .catch(() => {
        /* Fehlerhafte Einzel-Abfrage soll die restliche Liste nicht kippen */
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const overrideName = nameOverride
    ? (i18n.language.startsWith("de") ? nameOverride.de : nameOverride.en)
    : null;
  const name = overrideName ?? (pokemon ? pokemonName(pokemon, i18n.language) : "…");

  return (
    <Link
      to={`/pokemon/${id}`}
      className={`${styles.row} ${ace ? styles.ace : ""}`}
    >
      <span className={styles.sprite}>
        {pokemon?.image && (
          <img src={pokemon.image} alt={name} loading="lazy" />
        )}
      </span>

      <span className={styles.body}>
        <span className={styles.head}>
          <span className={styles.name}>{name}</span>
          <span className={styles.level}>{t("guide.level", { level })}</span>
          {ace && (
            <Star size={13} className={styles.star} aria-label={t("guide.ace")} />
          )}
          <ChevronRight
            size={16}
            className={styles.chevron}
            aria-hidden="true"
          />
        </span>

        {weak.length > 0 && (
          <span className={styles.weak}>
            <span className={styles.weakLabel}>{t("guide.weakTo")}</span>
            {weak.map(({ type, factor }) => (
              <span
                key={`${type}-${factor}`}
                className={styles.badge}
                style={{ backgroundColor: typeColors[type] }}
              >
                {t(`types.${type}`)}
                {factor === 4 ? " ×4" : ""}
              </span>
            ))}
          </span>
        )}
      </span>
    </Link>
  );
}
