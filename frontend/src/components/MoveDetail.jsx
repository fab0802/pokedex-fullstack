import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useGame } from "../context/useGame";
import { useMovesList } from "../context/useMovesList";
import { DEFAULT_MOVE_FILTERS } from "../context/movesListContextObject";
import { games, VERSION_GROUP_ORDER } from "./games";
import { moveName } from "./moveName";
import { pokemonName } from "./pokemonName";
import { typeColors } from "./typeColors";
import {
  getMove,
  getMovesForGame,
  filterAndSortMoves,
  formatMachine,
} from "./movesData";
import { fetchMoveTexts, fetchMoveLearners } from "../services/pokeApi";
import MoveCategoryIcon from "./MoveCategoryIcon";
import allNames from "../data/pokemonNames.json";
import styles from "./MoveDetail.module.css";

const NAME_BY_ID = new Map(allNames.map((p) => [p.id, p]));
const ALL_VGS = games.flatMap((g) => g.versionGroups);
const METHODS = ["level-up", "machine", "egg", "tutor"];
const METHOD_LABEL = {
  "level-up": "moves.levelUp",
  machine: "moves.machine",
  egg: "moves.egg",
  tutor: "moves.tutor",
  other: "moveGuide.other",
};

// Seltene Methoden (Formwechsel, Event, …) unter "other" zusammenfassen
const normalizeMethod = (m) => (METHODS.includes(m) ? m : "other");

function spriteUrl(id) {
  return `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/${id}.png`;
}

// Beschreibung wählen: aktive Sprache vor Englisch, gewähltes Spiel vor
// neuestem Spiel. Ältere Spiele haben oft keine deutschen Texte.
function pickText(texts, lang, game) {
  const langs = lang.startsWith("de") ? ["de", "en"] : ["en"];
  const rank = (vg) => {
    const i = VERSION_GROUP_ORDER.indexOf(vg);
    return i === -1 ? Infinity : i;
  };
  for (const l of langs) {
    const inLang = texts.filter((t) => t.lang === l);
    if (inLang.length === 0) continue;
    const fromGame = [...game.versionGroups]
      .reverse()
      .map((vg) => inLang.find((t) => t.versionGroup === vg))
      .find(Boolean);
    if (fromGame) return fromGame.text;
    return [...inLang].sort(
      (a, b) => rank(a.versionGroup) - rank(b.versionGroup),
    )[0].text;
  }
  return null;
}

export default function MoveDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { selectedGame } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const hasGame = selectedGame.id !== "all";
  const vgs = hasGame ? selectedGame.versionGroups : ALL_VGS;
  const vgKey = vgs.join(",");

  const move = useMemo(() => getMove(slug, selectedGame), [slug, selectedGame]);
  const { filters, sort, lastVisitedSlugRef } = useMovesList();
  const [direction, setDirection] = useState(1);
  const touchStart = useRef(null);

  // Reihenfolge fürs Blättern: dieselbe wie in der Liste (Filter + Sortierung
  // aus dem Context). Liegt die Attacke dort nicht drin (z. B. aus dem
  // Moves-Tab eines Pokémon geöffnet), alle Attacken des Spiels nach Name.
  // Aus dem Moves-Tab eines Pokémon geöffnet? Dann nur durch dessen
  // Attacken blättern, in der Reihenfolge des Tabs (kommt per location.state).
  const pokemonOrder = location.state?.moveOrder;

  const order = useMemo(() => {
    if (pokemonOrder?.includes(slug)) {
      return pokemonOrder.map((s) => getMove(s, selectedGame)).filter(Boolean);
    }
    const all = getMovesForGame(selectedGame);
    const opts = { hasGame, lang };
    const listed = filterAndSortMoves(all, filters, sort, opts);
    if (listed.some((m) => m.slug === slug)) return listed;
    return filterAndSortMoves(
      all,
      DEFAULT_MOVE_FILTERS,
      { key: "name", dir: "asc" },
      opts,
    );
  }, [pokemonOrder, selectedGame, filters, sort, hasGame, lang, slug]);
  const index = order.findIndex((m) => m.slug === slug);
  const prev = index > 0 ? order[index - 1] : null;
  const next =
    index !== -1 && index < order.length - 1 ? order[index + 1] : null;

  // Anker für die Liste: beim Zurückkehren dorthin scrollen – auch wenn man
  // inzwischen zu einer anderen Attacke weitergeblättert hat.
  useEffect(() => {
    lastVisitedSlugRef.current = slug;
  }, [slug, lastVisitedSlugRef]);

  const [texts, setTexts] = useState(null);
  const [learners, setLearners] = useState(null);
  // Filter gehört zur Attacke: bei anderem Slug automatisch wieder "all"
  // (ohne useEffect, gleiches Muster wie beim result-Check in PokemonMoves)
  const [methodState, setMethodState] = useState({ slug, method: "all" });
  const method = methodState.slug === slug ? methodState.method : "all";
  const setMethod = (m) => setMethodState({ slug, method: m });
  const exists = move !== null;

  useEffect(() => {
    if (!exists) return;
    let cancelled = false;
    fetchMoveTexts(slug)
      .then((res) => !cancelled && setTexts({ slug, list: res }))
      .catch(() => !cancelled && setTexts({ slug, error: true }));
    return () => {
      cancelled = true;
    };
  }, [slug, exists]);

  useEffect(() => {
    if (!exists) return;
    let cancelled = false;
    fetchMoveLearners(slug, vgKey.split(","))
      .then(
        (res) =>
          !cancelled && setLearners({ key: `${slug}|${vgKey}`, list: res }),
      )
      .catch(
        () =>
          !cancelled && setLearners({ key: `${slug}|${vgKey}`, error: true }),
      );
    return () => {
      cancelled = true;
    };
  }, [slug, vgKey, exists]);

  // Direkt aufgerufen (Link von aussen, Reload)? key "default" = erster
  // Eintrag der History. Beim Blättern wird das im state mitgegeben.
  const direct = location.state?.direct ?? location.key === "default";

  // Zurück: zur Seite, von der man kam (Liste oder Pokémon), sonst zur Liste.
  function goBack() {
    if (direct) navigate("/moves");
    else navigate(-1);
  }

  // Blättern ersetzt den History-Eintrag (replace), statt einen neuen
  // anzulegen. So führt "Zurück" nach 10x Swipen direkt zur Herkunft
  // und nicht durch alle 10 Attacken.
  function go(target, dir) {
    if (!target) return;
    setDirection(dir);
    // Bestehenden state (z. B. moveOrder) weiterreichen, sonst geht er
    // nach dem ersten Blättern verloren.
    navigate(`/moves/${target.slug}`, {
      replace: true,
      state: { ...location.state, direct },
    });
  }

  // Tastatur: Pfeile blättern, Escape geht zurück
  useEffect(() => {
    function onKey(e) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "ArrowLeft") go(prev, -1);
      else if (e.key === "ArrowRight") go(next, 1);
      else if (e.key === "Escape") goBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function onTouchStart(e) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  // Wischen nur werten, wenn deutlich horizontal (sonst ist es Scrollen)
  function onTouchEnd(e) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) go(next, 1);
    else go(prev, -1);
  }

  if (!move) {
    return (
      <main className={styles.page}>
        <p className={styles.empty}>{t("moveGuide.notFound")}</p>
        <Link to="/moves" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t("moveGuide.title")}
        </Link>
      </main>
    );
  }

  // Nur Ergebnisse verwenden, die zur aktuellen Attacke / zum Spiel gehören
  const currentTexts = texts?.slug === slug ? texts : null;
  const currentLearners =
    learners?.key === `${slug}|${vgKey}` ? learners : null;
  const description = currentTexts?.list
    ? pickText(currentTexts.list, lang, selectedGame)
    : null;

  const learnerList = (currentLearners?.list ?? []).map((l) => ({
    ...l,
    methods: [...new Set(l.methods.map(normalizeMethod))],
  }));
  const counts = {};
  for (const l of learnerList) {
    for (const m of l.methods) counts[m] = (counts[m] ?? 0) + 1;
  }
  const chips = [...METHODS, "other"].filter((m) => counts[m]);
  const shown =
    method === "all"
      ? learnerList
      : learnerList.filter((l) => l.methods.includes(method));

  const otherName = lang.startsWith("de")
    ? moveName(slug, "en")
    : moveName(slug, "de");
  const dash = "–";
  const stats = [
    { label: "moveGuide.stat.power", value: move.power ?? dash },
    { label: "moveGuide.stat.accuracy", value: move.accuracy ?? dash },
    { label: "moveGuide.stat.pp", value: move.pp ?? dash },
    {
      label: "moveGuide.stat.priority",
      value: move.priority > 0 ? `+${move.priority}` : move.priority,
    },
  ];
  if (hasGame && move.tm) {
    stats.push({
      label: "moveGuide.stat.tm",
      value: formatMachine(move.tm, lang),
    });
  }

  function methodText(l) {
    return l.methods
      .map((m) =>
        m === "level-up" && l.level > 0
          ? t("common.level", { level: l.level })
          : t(METHOD_LABEL[m]),
      )
      .join(" · ");
  }

  // Normale Render-Funktion statt Komponente: eine innerhalb der Komponente
  // definierte Komponente würde bei jedem Render neu gemountet.
  function renderNeighbor(target, dir) {
    if (!target) return <span />;
    const Chevron = dir < 0 ? ChevronLeft : ChevronRight;
    return (
      <button
        type="button"
        className={`${styles.preview} ${dir > 0 ? styles.previewRight : ""}`}
        onClick={() => go(target, dir)}
        title={t(dir < 0 ? "moveGuide.prev" : "moveGuide.next")}
      >
        {dir < 0 && <Chevron size={18} aria-hidden="true" />}
        <span className={styles.previewText}>
          <span className={styles.previewName}>
            {moveName(target.slug, lang)}
          </span>
          {target.type && (
            <span
              className={styles.previewType}
              style={{ color: typeColors[target.type] }}
            >
              {t(`types.${target.type}`)}
            </span>
          )}
        </span>
        {dir > 0 && <Chevron size={18} aria-hidden="true" />}
      </button>
    );
  }

  return (
    <main
      className={styles.page}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button type="button" className={styles.back} onClick={goBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t("moveGuide.back")}
      </button>

      {index !== -1 && (
        <div className={styles.pager}>
          {renderNeighbor(prev, -1)}
          {renderNeighbor(next, 1)}
        </div>
      )}

      <motion.div
        key={slug}
        initial={{ opacity: 0, x: direction * 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header className={styles.header}>
          <h1 className={styles.title}>{moveName(slug, lang)}</h1>
          {move.type && (
            <span
              className={styles.typeBadge}
              style={{
                color: typeColors[move.type],
                backgroundColor: `${typeColors[move.type]}22`,
                borderColor: `${typeColors[move.type]}55`,
              }}
            >
              {t(`types.${move.type}`)}
            </span>
          )}
          <span className={styles.category}>
            <MoveCategoryIcon category={move.class} />
            {t(`moveGuide.class.${move.class}`)}
          </span>
        </header>
        <p className={styles.sub}>
          {otherName}
          {hasGame && ` · ${t(`games.${selectedGame.id}`)}`}
        </p>

        {!move.inGame && (
          <p className={styles.notice}>{t("moveGuide.notInGame")}</p>
        )}

        <div className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statLabel}>{t(s.label)}</span>
              <span className={styles.statValue}>{s.value}</span>
            </div>
          ))}
        </div>

        {description && <p className={styles.description}>{description}</p>}

        <section className={styles.learners}>
          <h2 className={styles.sectionTitle}>
            {t("moveGuide.learnedBy")}
            {currentLearners?.list && ` (${learnerList.length})`}
          </h2>

          {!currentLearners && (
            <p className={styles.empty}>{t("common.loading")}</p>
          )}
          {currentLearners?.error && (
            <p className={styles.empty}>{t("moveGuide.learnersError")}</p>
          )}
          {currentLearners?.list && learnerList.length === 0 && (
            <p className={styles.empty}>{t("moveGuide.noLearners")}</p>
          )}

          {learnerList.length > 0 && (
            <>
              <div
                className={styles.chips}
                role="group"
                aria-label={t("moveGuide.filterMethod")}
              >
                {["all", ...chips].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.chip} ${method === m ? styles.chipActive : ""}`}
                    aria-pressed={method === m}
                    onClick={() => setMethod(m)}
                  >
                    {m === "all" ? t("moveGuide.all") : t(METHOD_LABEL[m])}
                    {m !== "all" && ` (${counts[m]})`}
                  </button>
                ))}
              </div>

              <ul className={styles.grid}>
                {shown.map((l) => (
                  <li key={l.id}>
                    <Link to={`/pokemon/${l.id}`} className={styles.mon}>
                      <img
                        src={spriteUrl(l.id)}
                        alt=""
                        width="40"
                        height="40"
                        loading="lazy"
                        className={styles.sprite}
                      />
                      <span className={styles.monText}>
                        <span className={styles.monName}>
                          {pokemonName(NAME_BY_ID.get(l.id), lang)}
                        </span>
                        <span className={styles.monMethod}>
                          {methodText(l)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </motion.div>
    </main>
  );
}
