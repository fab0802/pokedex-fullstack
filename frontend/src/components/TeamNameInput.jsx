import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTeams } from "../context/useTeams";
import { useToast } from "../context/useToast";
import styles from "./Teams.module.css";

// Teamname als Eingabefeld im Bearbeiten-Modus.
// Enter oder Verlassen des Feldes speichert, Escape verwirft die Änderung.
export default function TeamNameInput({ team }) {
  const { t } = useTranslation();
  const { renameTeam, maxTeamNameLength } = useTeams();
  const { showToast } = useToast();
  // Lokaler Entwurf: Tippen ändert nur diesen State, gespeichert wird erst
  // beim Verlassen. So gibt es keinen API-Call pro Tastendruck.
  const [draft, setDraft] = useState(team.name);
  // Merkt sich, dass Escape gedrückt wurde, damit das folgende onBlur
  // nicht doch noch speichert.
  const cancelled = useRef(false);

  async function save() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const name = draft.trim();
    if (name === "") {
      setDraft(team.name); // leerer Name ist nicht erlaubt → zurücksetzen
      return;
    }
    try {
      const changed = await renameTeam(team._id, name);
      setDraft(name); // getrimmte Version anzeigen
      if (changed) showToast(t("teams.teamRenamed", { team: name }));
    } catch {
      setDraft(team.name); // Server-Stand wiederherstellen
      showToast(t("teams.renameError"), { type: "error" });
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.currentTarget.blur(); // löst onBlur → save() aus
    } else if (e.key === "Escape") {
      cancelled.current = true;
      setDraft(team.name);
      e.currentTarget.blur();
    }
  }

  return (
    <input
      className={styles.teamNameInput}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={handleKeyDown}
      maxLength={maxTeamNameLength}
      aria-label={t("teams.teamNameLabel")}
    />
  );
}
