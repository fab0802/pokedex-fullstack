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
import { useToast } from "../context/useToast";
import { fetchPokemonById } from "../services/pokeApi";
import { typeColors } from "./typeColors";
import AddPokemonSearch from "./AddPokemonSearch";
import ConfirmDialog from "./ConfirmDialog";
import { useTranslation } from "react-i18next";
import { pokemonName } from "./pokemonName";
import styles from "./Teams.module.css";

export default function Teams() {
  const { t, i18n } = useTranslation();
  const {
    teams,
    loading,
    removePokemonFromTeam,
    movePokemon,
    removeTeam,
    maxTeamSize,
  } = useTeams();
  const { showToast } = useToast();
  const [pokemonById, setPokemonById] = useState({});
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmTeamId, setConfirmTeamId] = useState(null);

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
    const teamName = teams.find((tm) => tm._id === teamId)?.name ?? "";
    try {
      await removeTeam(teamId);
      showToast(t("teams.teamDeleted", { team: teamName }), {
        type: "neutral",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmDelete() {
    const id = confirmTeamId;
    setConfirmTeamId(null);
    await handleDelete(id);
  }

  async function handleRemovePokemon(teamId, pokemonId) {
    setError(null);
    const teamName = teams.find((tm) => tm._id === teamId)?.name ?? "";
    const name =
      pokemonName(pokemonById[pokemonId], i18n.language) || `#${pokemonId}`;
    try {
      await removePokemonFromTeam(teamId, pokemonId);
      showToast(t("teams.pokemonRemoved", { name, team: teamName }), {
        type: "neutral",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleEdit(teamId) {
    setEditingId((prev) => (prev === teamId ? null : teamId));
  }

  const confirmingTeam = teams.find((team) => team._id === confirmTeamId);

  return (
    <div className={styles.wrapper}>
      <h1>{t("teams.title")}</h1>
      {error && <p className={styles.message}>{error}</p>}
      {loading && <p className={styles.message}>{t("teams.loading")}</p>}
      {!loading && teams.length === 0 && <p>{t("teams.noTeams")}</p>}
      {teams.length === 0 && <p>{t("teams.noTeams")}</p>}
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
                    onClick={() => setConfirmTeamId(team._id)}
                    title={t("teams.deleteTeam")}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  className={styles.editButton}
                  onClick={() => toggleEdit(team._id)}
                  title={isEditing ? t("teams.done") : t("teams.editTeam")}
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
                          title={t("teams.remove")}
                        >
                          <X size={14} />
                        </button>
                        <div className={styles.moveButtons}>
                          <button
                            className={styles.moveButton}
                            onClick={() => movePokemon(team._id, id, -1)}
                            disabled={index === 0}
                            title={t("teams.moveLeft")}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            className={styles.moveButton}
                            onClick={() => movePokemon(team._id, id, 1)}
                            disabled={index === team.pokemonIds.length - 1}
                            title={t("teams.moveRight")}
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
                          alt={pokemonName(p, i18n.language)}
                          width={64}
                          height={64}
                        />
                        <span className={styles.memberName}>
                          {pokemonName(p, i18n.language)}
                        </span>
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
                  teamName={team.name}
                />
              ) : (
                <p className={styles.fullNote}>{t("teams.full")}</p>
              ))}
          </div>
        );
      })}
      <ConfirmDialog
        open={confirmTeamId !== null}
        title={t("teams.deleteConfirmTitle")}
        message={t("teams.deleteConfirmMessage", {
          name: confirmingTeam?.name,
        })}
        confirmLabel={t("teams.confirmDelete")}
        cancelLabel={t("teams.cancel")}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTeamId(null)}
      />
    </div>
  );
}
