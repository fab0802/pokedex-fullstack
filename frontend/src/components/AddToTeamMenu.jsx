import { useState } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useTeams } from "../context/useTeams";
import styles from "./AddToTeamMenu.module.css";

export default function AddToTeamMenu({ pokemonId }) {
  const { teams, addPokemonToTeam, createTeamWithPokemon, maxTeamSize } =
    useTeams();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState(null);

  const id = Number(pokemonId);

  async function handleAdd(teamId) {
    setError(null);
    try {
      await addPokemonToTeam(teamId, id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate() {
    if (newName.trim() === "") return;
    setError(null);
    try {
      await createTeamWithPokemon(newName.trim(), id);
      setNewName("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        + Add to team <ChevronDown size={16} />
      </button>

      {open && (
        <div className={styles.menu}>
          {teams.length === 0 && <p className={styles.empty}>No teams yet.</p>}
          {teams.map((team) => {
            const inTeam = team.pokemonIds.includes(id);
            const full = team.pokemonIds.length >= maxTeamSize;
            return (
              <button
                key={team._id}
                className={styles.item}
                onClick={() => handleAdd(team._id)}
                disabled={inTeam || full}
              >
                <span>{team.name}</span>
                <span className={styles.status}>
                  {inTeam ? (
                    <Check size={16} />
                  ) : full ? (
                    "full"
                  ) : (
                    `${team.pokemonIds.length}/${maxTeamSize}`
                  )}
                </span>
              </button>
            );
          })}

          <div className={styles.newTeam}>
            <input
              className={styles.newInput}
              placeholder="New team name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              className={styles.createButton}
              onClick={handleCreate}
              disabled={newName.trim() === ""}
              title="Create team"
            >
              <Plus size={16} />
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </div>
  );
}
