import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useTeams } from "../context/useTeams";
import { useTranslation } from "react-i18next";
import allNames from "../data/pokemonNames.json";
import { pokemonName } from "./pokemonName";
import styles from "./AddPokemonSearch.module.css";

export default function AddPokemonSearch({ teamId, currentIds }) {
  const { t, i18n } = useTranslation();
  const { addPokemonToTeam } = useTeams();
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  // Sucht in beiden Sprachen, unabhaengig von der eingestellten UI-Sprache
  const q = query.trim().toLowerCase();
  const matches = q
    ? allNames
        .filter(
          (p) =>
            p.name.includes(q) || p.nameDe.toLowerCase().includes(q),
        )
        .slice(0, 8)
    : [];

  async function handleAdd(id) {
    setError(null);
    try {
      await addPokemonToTeam(teamId, id);
      setQuery("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        placeholder={t("teams.addPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className={styles.results}>
          {matches.map((p) => {
            const inTeam = currentIds.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  className={styles.result}
                  onClick={() => handleAdd(p.id)}
                  disabled={inTeam}
                >
                  <span className={styles.resultId}>#{p.id}</span>
                  <span className={styles.resultName}>
                    {pokemonName(p, i18n.language)}
                  </span>
                  {inTeam ? <Check size={16} /> : <Plus size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
