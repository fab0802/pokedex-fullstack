import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, X } from "lucide-react";
import { useTeams } from "../context/useTeams";
import { useToast } from "../context/useToast";
import { useTranslation } from "react-i18next";
import ConfirmDialog from "./ConfirmDialog";
import styles from "./AddToTeamMenu.module.css";

export default function AddToTeamMenu({ pokemonId, pokemonName }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    teams,
    addPokemonToTeam,
    removePokemonFromTeam,
    createTeamWithPokemon,
    maxTeamSize,
  } = useTeams();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState(null);
  const [confirmTeamId, setConfirmTeamId] = useState(null);

  const id = Number(pokemonId);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleAdd(teamId) {
    setError(null);
    try {
      await addPokemonToTeam(teamId, id);
      const team = teams.find((t) => t._id === teamId);
      setOpen(false);
      showToast(
        t("addToTeam.added", { name: pokemonName, team: team?.name ?? "" }),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(teamId) {
    setError(null);
    const team = teams.find((t) => t._id === teamId);
    try {
      await removePokemonFromTeam(teamId, id);
      showToast(
        t("teams.pokemonRemoved", {
          name: pokemonName,
          team: team?.name ?? "",
        }),
        { type: "neutral" },
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmRemove() {
    const teamId = confirmTeamId;
    setConfirmTeamId(null);
    setOpen(false);
    await handleRemove(teamId);
  }

  async function handleCreate() {
    if (newName.trim() === "") return;
    setError(null);
    const teamName = newName.trim();
    try {
      await createTeamWithPokemon(teamName, id);
      setNewName("");
      setOpen(false);
      showToast(t("addToTeam.teamCreated", { team: teamName }));
      showToast(t("addToTeam.added", { name: pokemonName, team: teamName }));
    } catch (err) {
      setError(err.message);
    }
  }

  const confirmingTeam = teams.find((t) => t._id === confirmTeamId);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        {t("addToTeam.trigger")} <ChevronDown size={16} />
      </button>

      {open && (
        <div className={styles.menu}>
          {teams.length === 0 && (
            <p className={styles.empty}>{t("addToTeam.noTeams")}</p>
          )}
          {teams.map((team) => {
            const inTeam = team.pokemonIds.includes(id);
            const full = team.pokemonIds.length >= maxTeamSize;
            return (
              <button
                key={team._id}
                className={`${styles.item} ${inTeam ? styles.inTeam : ""}`}
                onClick={() =>
                  inTeam ? setConfirmTeamId(team._id) : handleAdd(team._id)
                }
                disabled={!inTeam && full}
                title={inTeam ? t("teams.remove") : undefined}
              >
                <span>{team.name}</span>
                <span className={styles.status}>
                  {inTeam ? (
                    <>
                      <span className={styles.inTeamDefault}>
                        <Check size={16} />
                      </span>
                      <span className={styles.inTeamHover}>
                        <X size={14} /> {t("teams.remove")}
                      </span>
                    </>
                  ) : full ? (
                    t("addToTeam.full")
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
              placeholder={t("addToTeam.newTeamName")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
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

      <ConfirmDialog
        open={confirmTeamId !== null}
        title={t("teams.removeConfirmTitle")}
        message={t("teams.removeConfirmMessage", {
          name: pokemonName,
          team: confirmingTeam?.name,
        })}
        confirmLabel={t("teams.confirmRemove")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setConfirmTeamId(null)}
      />
    </div>
  );
}
