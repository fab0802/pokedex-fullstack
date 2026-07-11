import { useEffect, useState } from "react";
import { getTeams } from "../services/teamApi";
import { fetchPokemonById } from "../services/pokeApi";
import styles from "./Teams.module.css";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [pokemonById, setPokemonById] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTeams();
        setTeams(data);

        // Alle IDs aus allen Teams einsammeln (ohne Duplikate)
        const ids = [...new Set(data.flatMap((t) => t.pokemonIds))];
        const details = await Promise.all(
          ids.map((id) => fetchPokemonById(id)),
        );

        // Nachschlage-Objekt: id -> Pokémon
        const map = {};
        details.forEach((p) => {
          map[p.id] = p;
        });
        setPokemonById(map);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div className={styles.wrapper}>
      <h1>My Teams</h1>
      {teams.length === 0 && <p>No teams yet.</p>}
      {teams.map((team) => (
        <div key={team._id} className={styles.team}>
          <h2 className={styles.teamName}>{team.name}</h2>
          <div className={styles.members}>
            {team.pokemonIds.map((id) => {
              const p = pokemonById[id];
              return (
                <div key={id} className={styles.member}>
                  {p ? (
                    <>
                      <img src={p.image} alt={p.name} width={72} height={72} />
                      <span className={styles.memberName}>{p.name}</span>
                    </>
                  ) : (
                    <span>#{id}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
