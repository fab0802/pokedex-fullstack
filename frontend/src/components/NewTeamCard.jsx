import { useState } from "react";
import { Plus } from "lucide-react";
import { useTeams } from "../context/useTeams";
import { useToast } from "../context/useToast";
import { useTranslation } from "react-i18next";
import styles from "./NewTeamCard.module.css";

export default function NewTeamCard({ onCreated }) {
  const { t } = useTranslation();
  const { createTeamWithPokemon } = useTeams();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState(null);

  async function handleCreate() {
    const teamName = name.trim();
    if (teamName === "") return;
    setError(null);
    try {
      const newTeam = await createTeamWithPokemon(teamName); // ohne Pokémon => leeres Team
      setName("");
      showToast(t("addToTeam.teamCreated", { team: teamName }));
      onCreated?.(newTeam._id); // Parent öffnet das neue Team direkt im Edit-Modus
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder={t("teams.newTeamPlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <button
          className={styles.createButton}
          onClick={handleCreate}
          disabled={name.trim() === ""}
          title={t("teams.createTeam")}
          aria-label={t("teams.createTeam")}
        >
          <Plus size={18} />
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
