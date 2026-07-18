import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import { getTeams, deleteTeam, updateTeam } from "../services/teamApi";
import { fetchPokemonById } from "../services/pokeApi";
import { typeColors } from "./typeColors";
import styles from "./Teams.module.css";

const MAX_TEAM_SIZE = 6;

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [pokemonById, setPokemonById] = useState({});
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTeams();
        setTeams(data);
        const ids = [...new Set(data.flatMap((t) => t.pokemonIds))];
        const details = await Promise.all(
          ids.map((id) => fetchPokemonById(id)),
        );
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

  async function handleDelete(teamId) {
    try {
      await deleteTeam(teamId);
      setTeams((prev) => prev.filter((t) => t._id !== teamId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemovePokemon(team, pokemonId) {
    const newIds = team.pokemonIds.filter((id) => id !== pokemonId);
    try {
      const updated = await updateTeam(team._id, team.name, newIds);
      setTeams((prev) => prev.map((t) => (t._id === team._id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleEdit(teamId) {
    setEditingId((prev) => (prev === teamId ? null : teamId));
  }

  if (error) return <p className={styles.message}>{error}</p>;

  return (
    <div className={styles.wrapper}>
      <h1>My Teams</h1>
      {teams.length === 0 && <p>No teams yet.</p>}
      {teams.map((team) => {
        const isEditing = editingId === team._id;
        return (
          <div key={team._id} className={styles.team}>
            <div className={styles.teamHeader}>
              <h2 className={styles.teamName}>{team.name}</h2>
              <div className={styles.headerRight}>
                <span className={styles.count}>
                  {team.pokemonIds.length} / {MAX_TEAM_SIZE}
                </span>
                {isEditing && (
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(team._id)}
                    title="Delete team"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  className={styles.editButton}
                  onClick={() => toggleEdit(team._id)}
                  title={isEditing ? "Done" : "Edit team"}
                >
                  {isEditing ? <Check size={18} /> : <Pencil size={16} />}
                </button>
              </div>
            </div>
            <div className={styles.members}>
              {team.pokemonIds.map((id) => {
                const p = pokemonById[id];
                return (
                  <div key={id} className={styles.memberWrap}>
                    {isEditing && (
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemovePokemon(team, id)}
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {p ? (
                      <Link
                        to={`/pokemon/${p.id}`}
                        className={styles.member}
                        style={{ backgroundColor: typeColors[p.types[0]] }}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          width={64}
                          height={64}
                        />
                        <span className={styles.memberName}>{p.name}</span>
                      </Link>
                    ) : (
                      <div className={styles.member}>
                        <span>#{id}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
