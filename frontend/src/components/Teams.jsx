import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Pencil,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTeams } from "../context/useTeams";
import { fetchPokemonById } from "../services/pokeApi";
import { typeColors } from "./typeColors";
import AddPokemonSearch from "./AddPokemonSearch";
import styles from "./Teams.module.css";

export default function Teams() {
  const { teams, removePokemonFromTeam, movePokemon, removeTeam, maxTeamSize } =
    useTeams();
  const [pokemonById, setPokemonById] = useState({});
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    async function loadImages() {
      try {
        const ids = [...new Set(teams.flatMap((t) => t.pokemonIds))];
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
    loadImages();
  }, [teams]);

  async function handleDelete(teamId) {
    setError(null);
    try {
      await removeTeam(teamId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemovePokemon(teamId, pokemonId) {
    setError(null);
    try {
      await removePokemonFromTeam(teamId, pokemonId);
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleEdit(teamId) {
    setEditingId((prev) => (prev === teamId ? null : teamId));
  }

  return (
    <div className={styles.wrapper}>
      <h1>My Teams</h1>
      {error && <p className={styles.message}>{error}</p>}
      {teams.length === 0 && <p>No teams yet.</p>}
      {teams.map((team) => {
        const isEditing = editingId === team._id;
        return (
          <div key={team._id} className={styles.team}>
            <div className={styles.teamHeader}>
              <h2 className={styles.teamName}>{team.name}</h2>
              <div className={styles.headerRight}>
                <span className={styles.count}>
                  {team.pokemonIds.length} / {maxTeamSize}
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
              {team.pokemonIds.map((id, index) => {
                const p = pokemonById[id];
                return (
                  <motion.div
                    key={id}
                    layout
                    transition={{ duration: 0.25 }}
                    className={styles.memberWrap}
                  >
                    {isEditing && (
                      <>
                        <button
                          className={styles.removeButton}
                          onClick={() => handleRemovePokemon(team._id, id)}
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                        <div className={styles.moveButtons}>
                          <button
                            className={styles.moveButton}
                            onClick={() => movePokemon(team._id, id, -1)}
                            disabled={index === 0}
                            title="Move left"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            className={styles.moveButton}
                            onClick={() => movePokemon(team._id, id, 1)}
                            disabled={index === team.pokemonIds.length - 1}
                            title="Move right"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </>
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
                  </motion.div>
                );
              })}
            </div>
            {isEditing &&
              (team.pokemonIds.length < maxTeamSize ? (
                <AddPokemonSearch
                  teamId={team._id}
                  currentIds={team.pokemonIds}
                />
              ) : (
                <p className={styles.fullNote}>Team is full (6/6)</p>
              ))}
          </div>
        );
      })}
    </div>
  );
}
