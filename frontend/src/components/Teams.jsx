import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Reorder, useDragControls } from "framer-motion";
import {
  Pencil,
  Check,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  RotateCcw,
  Swords,
} from "lucide-react";
import { useTeams } from "../context/useTeams";
import { useToast } from "../context/useToast";
import { fetchPokemonById } from "../services/pokeApi";
import { typeBannerStyle } from "./typeBannerStyle";
import AddPokemonSearch from "./AddPokemonSearch";
import ConfirmDialog from "./ConfirmDialog";
import MovesetPicker from "./MovesetPicker";
import { moveName } from "./moveName";
import { useTranslation } from "react-i18next";
import { pokemonName } from "./pokemonName";
import NewTeamCard from "./NewTeamCard";
import Skeleton from "./Skeleton";
import styles from "./Teams.module.css";

// Platzhalter-Karten im Team-Layout, solange die Teams geladen werden.
function TeamsSkeleton() {
  const fakeTeams = [3, 2, 4]; // Anzahl Platzhalter-Pokémon pro Karte
  return (
    <div aria-hidden="true">
      {fakeTeams.map((count, i) => (
        <div key={i} className={styles.team}>
          <div className={styles.teamHeader}>
            <Skeleton width="40%" height={20} />
          </div>
          <div className={styles.members}>
            {Array.from({ length: count }).map((_, j) => (
              <Skeleton key={j} width={90} height={96} radius={12} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Eine Team-Karte als ziehbares Reorder-Item.
// dragListener=false + dragControls: Ziehen startet NUR über den Griff,
// nicht über die ganze Karte (sonst blockiert es das Seiten-Scrollen).
// Render-Prop reicht `controls` an den Griff durch – so bleibt der restliche
// Karten-Inhalt in Teams.jsx ohne Prop-Drilling.
function TeamItem({ team, onDragEnd, registerRef, children }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={team}
      as="div"
      ref={(node) => registerRef(team._id, node)}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className={styles.team}
    >
      {children(controls)}
    </Reorder.Item>
  );
}

export default function Teams() {
  const { t, i18n } = useTranslation();
  const {
    teams,
    loading,
    removePokemonFromTeam,
    movePokemon,
    reorderPokemon,
    persistPokemonOrder,
    undoTeamChange,
    canUndo,
    clearHistory,
    beginPokemonDrag,
    moveTeam,
    reorderTeamsLive,
    persistTeamsOrder,
    removeTeam,
    maxTeamSize,
  } = useTeams();
  const { showToast } = useToast();
  const [pokemonById, setPokemonById] = useState({});
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmTeamId, setConfirmTeamId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null); // { teamId, pokemonId } | null
  const [movesetTarget, setMovesetTarget] = useState(null); // { teamId, pokemonId } | null
  const teamRefs = useRef({}); // _id -> DOM-Node der Team-Karte
  const pendingScrollId = useRef(null); // ID des neuen Teams, das noch gescrollt werden soll

  // Neu erstelltes Team sichtbar scrollen. Reagiert auf teams-Aenderungen und
  // laeuft nach dem Render, wenn die neue Karte im DOM haengt. Reset ueber die
  // Ref (kein setState) => kein zusaetzlicher Re-Render.
  useEffect(() => {
    const id = pendingScrollId.current;
    if (!id) return;
    const node = teamRefs.current[id];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      pendingScrollId.current = null; // nur einmal ausfuehren
    }
  }, [teams]);

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

  async function confirmRemovePokemon() {
    const pending = confirmRemove;
    setConfirmRemove(null);
    if (pending) await handleRemovePokemon(pending.teamId, pending.pokemonId);
  }

  function toggleEdit(teamId) {
    const wasEditing = editingId;
    // Beim Wechsel auf ein anderes Team dessen Verlauf mit verwerfen.
    if (wasEditing && wasEditing !== teamId) clearHistory(wasEditing);
    if (wasEditing === teamId) {
      clearHistory(teamId); // dasselbe Team schliessen → Verlauf leeren
      setEditingId(null);
    } else {
      setEditingId(teamId);
    }
  }

  const confirmingTeam = teams.find((team) => team._id === confirmTeamId);
  const removingTeam = confirmRemove
    ? teams.find((team) => team._id === confirmRemove.teamId)
    : null;
  const removingName = confirmRemove
    ? pokemonName(pokemonById[confirmRemove.pokemonId], i18n.language) ||
      `#${confirmRemove.pokemonId}`
    : "";

  return (
    <div className={styles.wrapper}>
      <h1>{t("teams.title")}</h1>
      {error && <p className={styles.message}>{error}</p>}
      {loading && (
        <>
          <p className={styles.srOnly} role="status">
            {t("teams.loading")}
          </p>
          <TeamsSkeleton />
        </>
      )}
      {!loading && (
        <NewTeamCard
          onCreated={(id) => {
            setEditingId(id);
            pendingScrollId.current = id;
          }}
        />
      )}
      {!loading && teams.length === 0 && <p>{t("teams.noTeams")}</p>}
      <Reorder.Group
        as="div"
        axis="y"
        values={teams}
        onReorder={reorderTeamsLive}
      >
        {teams.map((team, teamIndex) => {
          const isEditing = editingId === team._id;
          return (
            <TeamItem
              key={team._id}
              team={team}
              registerRef={(id, node) => {
                if (node) teamRefs.current[id] = node;
                else delete teamRefs.current[id];
              }}
              onDragEnd={() =>
                persistTeamsOrder(teams.map((tm) => tm._id)).catch(() =>
                  showToast(t("teams.reorderError"), { type: "error" }),
                )
              }
            >
              {(controls) => (
                <>
                  <div className={styles.teamHeader}>
                    <div className={styles.teamNameGroup}>
                      <button
                        className={styles.dragHandle}
                        onPointerDown={(e) => controls.start(e)}
                        title={t("teams.dragHandle")}
                        aria-label={t("teams.dragHandle")}
                      >
                        <GripVertical size={18} />
                      </button>
                      <h2 className={styles.teamName}>{team.name}</h2>
                    </div>
                    <div className={styles.headerRight}>
                      <div className={styles.teamMoveButtons}>
                        <button
                          className={styles.moveButton}
                          onClick={() =>
                            moveTeam(team._id, -1).catch(() =>
                              showToast(t("teams.reorderError"), {
                                type: "error",
                              }),
                            )
                          }
                          disabled={teamIndex === 0}
                          title={t("teams.moveUp")}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          className={styles.moveButton}
                          onClick={() =>
                            moveTeam(team._id, 1).catch(() =>
                              showToast(t("teams.reorderError"), {
                                type: "error",
                              }),
                            )
                          }
                          disabled={teamIndex === teams.length - 1}
                          title={t("teams.moveDown")}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      <span className={styles.count}>
                        {team.pokemonIds.length} / {maxTeamSize}
                      </span>
                      {isEditing && (
                        <button
                          className={styles.moveButton}
                          onClick={() =>
                            undoTeamChange(team._id).catch(() =>
                              showToast(t("teams.undoError"), {
                                type: "error",
                              }),
                            )
                          }
                          disabled={!canUndo(team._id)}
                          title={t("teams.undo")}
                          aria-label={t("teams.undo")}
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
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
                        title={
                          isEditing ? t("teams.done") : t("teams.editTeam")
                        }
                      >
                        {isEditing ? <Check size={18} /> : <Pencil size={16} />}
                      </button>
                    </div>
                  </div>
                  <Reorder.Group
                    as="div"
                    axis={isEditing ? "y" : "x"}
                    values={team.pokemonIds}
                    onReorder={(newIds) => reorderPokemon(team._id, newIds)}
                    data-editing={isEditing}
                    className={styles.members}
                  >
                    {team.pokemonIds.map((id, index) => {
                      const p = pokemonById[id];
                      const memberMoves = team.movesets?.[String(id)] ?? [];
                      return (
                        <Reorder.Item
                          key={id}
                          value={id}
                          as="div"
                          dragListener={isEditing}
                          onDragStart={() => beginPokemonDrag(team._id)}
                          onDragEnd={() =>
                            persistPokemonOrder(
                              team._id,
                              team.name,
                              team.pokemonIds,
                            ).catch(() =>
                              showToast(t("teams.reorderError"), {
                                type: "error",
                              }),
                            )
                          }
                          data-editing={isEditing}
                          className={styles.memberWrap}
                        >
                          {isEditing && (
                            <span
                              className={styles.dragGrip}
                              aria-hidden="true"
                            >
                              <GripVertical size={16} />
                            </span>
                          )}
                          {p ? (
                            <Link
                              to={`/pokemon/${p.id}`}
                              state={{
                                team: {
                                  ids: team.pokemonIds,
                                  id: team._id,
                                  name: team.name,
                                },
                              }}
                              className={styles.member}
                              style={typeBannerStyle(p.types)}
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
                          {memberMoves.length > 0 && (
                            <div className={styles.moveBadges}>
                              {memberMoves.map((slug) => (
                                <span key={slug} className={styles.moveBadge}>
                                  {moveName(slug, i18n.language)}
                                </span>
                              ))}
                            </div>
                          )}
                          {isEditing && (
                            <div className={styles.memberControls}>
                              <button
                                className={styles.moveButton}
                                onClick={() =>
                                  setMovesetTarget({
                                    teamId: team._id,
                                    pokemonId: id,
                                  })
                                }
                                title={t("teams.editMoves")}
                                aria-label={t("teams.editMoves")}
                              >
                                <Swords size={16} />
                              </button>
                              <button
                                className={styles.moveButton}
                                onClick={() => movePokemon(team._id, id, -1)}
                                disabled={index === 0}
                                title={t("teams.moveUp")}
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                className={styles.moveButton}
                                onClick={() => movePokemon(team._id, id, 1)}
                                disabled={index === team.pokemonIds.length - 1}
                                title={t("teams.moveDown")}
                              >
                                <ChevronDown size={16} />
                              </button>
                              <button
                                className={styles.removeButton}
                                onClick={() =>
                                  setConfirmRemove({
                                    teamId: team._id,
                                    pokemonId: id,
                                  })
                                }
                                title={t("teams.remove")}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
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
                </>
              )}
            </TeamItem>
          );
        })}
      </Reorder.Group>
      <ConfirmDialog
        open={confirmTeamId !== null}
        title={t("teams.deleteConfirmTitle")}
        message={t("teams.deleteConfirmMessage", {
          name: confirmingTeam?.name,
        })}
        confirmLabel={t("common.confirmDelete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTeamId(null)}
      />
      <ConfirmDialog
        open={confirmRemove !== null}
        title={t("teams.removeConfirmTitle")}
        message={t("teams.removeConfirmMessage", {
          name: removingName,
          team: removingTeam?.name,
        })}
        confirmLabel={t("teams.confirmRemove")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={confirmRemovePokemon}
        onCancel={() => setConfirmRemove(null)}
      />
      {movesetTarget &&
        (() => {
          const team = teams.find((tm) => tm._id === movesetTarget.teamId);
          if (!team) return null;
          const label =
            pokemonName(
              pokemonById[movesetTarget.pokemonId],
              i18n.language,
            ) || `#${movesetTarget.pokemonId}`;
          return (
            <MovesetPicker
              team={team}
              pokemonId={movesetTarget.pokemonId}
              pokemonLabel={label}
              onClose={() => setMovesetTarget(null)}
            />
          );
        })()}
    </div>
  );
}
