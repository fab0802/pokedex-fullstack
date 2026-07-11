import { useState } from "react";
import { useTeamBuilder } from "../context/useTeamBuilder";
import styles from "./TeamBar.module.css";

export default function TeamBar() {
  const {
    name,
    setName,
    pokemonIds,
    removeFromTeam,
    clearTeam,
    saveTeam,
    maxTeamSize,
  } = useTeamBuilder();
  const [status, setStatus] = useState(null);

  async function handleSave() {
    setStatus(null);
    try {
      await saveTeam();
      setStatus("Team saved!");
      clearTeam();
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <div className={styles.bar}>
      <input
        className={styles.nameInput}
        placeholder="Team name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className={styles.slots}>
        {Array.from({ length: maxTeamSize }).map((_, i) => {
          const id = pokemonIds[i];
          return (
            <div key={i} className={styles.slot}>
              {id ? (
                <button
                  className={styles.chip}
                  onClick={() => removeFromTeam(id)}
                >
                  #{id} ✕
                </button>
              ) : (
                <span className={styles.empty}>—</span>
              )}
            </div>
          );
        })}
      </div>
      <button
        className={styles.saveButton}
        onClick={handleSave}
        disabled={pokemonIds.length === 0 || name.trim() === ""}
      >
        Save team
      </button>
      {status && <p className={styles.status}>{status}</p>}
    </div>
  );
}
