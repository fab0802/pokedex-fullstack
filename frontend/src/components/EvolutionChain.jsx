import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchEvolutionChain,
  fetchLocalizedNames,
  fetchPokemonById,
} from "../services/pokeApi";
import { pokemonName } from "./pokemonName";
import { formatEvolutionCondition } from "./evolutionCondition";
import styles from "./EvolutionChain.module.css";

// Sammelt alle IDs im Baum ein - ebenfalls rekursiv.
function collectIds(node, acc = []) {
  acc.push(node.id);
  node.next.forEach((child) => collectIds(child, acc));
  return acc;
}

// Sammelt alle benannten Ressourcen (Items, Orte, Attacken) im Baum ein,
// damit wir ihre Namen im Voraus laden koennen.
function collectNamedRefs(node, acc = []) {
  node.details.forEach((d) => {
    if (d.item?.name) acc.push(["item", d.item.name]);
    if (d.held_item?.name) acc.push(["item", d.held_item.name]);
    if (d.known_move?.name) acc.push(["move", d.known_move.name]);
    if (d.location?.name) acc.push(["location", d.location.name]);
  });
  node.next.forEach((child) => collectNamedRefs(child, acc));
  return acc;
}

function Sprite({ node, pokemonById, currentId, lang }) {
  const p = pokemonById[node.id];
  const isCurrent = node.id === currentId;

  return (
    <Link
      to={`/pokemon/${node.id}`}
      className={`${styles.sprite} ${isCurrent ? styles.current : ""}`}
      aria-current={isCurrent ? "page" : undefined}
    >
      <img
        src={p?.image}
        alt=""
        className={styles.spriteImg}
        loading="lazy"
        onError={(e) => {
          e.target.src = "/fallback-pokeball.svg";
        }}
      />
      <span className={styles.spriteName}>{pokemonName(p, lang)}</span>
    </Link>
  );
}

// Rendert eine Stufe und - je nach Anzahl Nachfolger - entweder
// eine Reihe (1 Nachfolger) oder eine Spalte (mehrere Nachfolger).
function Stage({ node, pokemonById, currentId, lang, t, names }) {
  const children = node.next;
  const sprite = (
    <Sprite
      node={node}
      pokemonById={pokemonById}
      currentId={currentId}
      lang={lang}
    />
  );

  if (children.length === 0) return sprite;

  if (children.length === 1) {
    const child = children[0];
    return (
      <>
        {sprite}
        <span className={styles.arrow}>
          <ChevronRight size={20} aria-hidden="true" />
          <span className={styles.arrowLabel}>
            {formatEvolutionCondition(child.details, t, names, lang)}
          </span>
        </span>
        <Stage
          node={child}
          pokemonById={pokemonById}
          currentId={currentId}
          lang={lang}
          t={t}
          names={names}
        />
      </>
    );
  }

  // Haben alle Zweige dieselbe Bedingung, gehoert sie an die Gabelung -
  // sonst an jeden Zweig einzeln.
  const labels = children.map((c) =>
    formatEvolutionCondition(c.details, t, names, lang),
  );
  const sharedLabel = labels.every((l) => l && l === labels[0])
    ? labels[0]
    : null;

  // Geht ein Zweig selbst noch weiter (Waumpel), braucht er eine eigene
  // Zeile. Sind alle Zweige Endpunkte (Evoli), passt das kompakte Grid.
  const hasDeepBranch = children.some((c) => c.next.length > 0);

  return (
    <>
      {sprite}
      <span className={styles.fork}>
        <ChevronRight size={20} aria-hidden="true" />
        {sharedLabel && (
          <span className={styles.arrowLabel}>{sharedLabel}</span>
        )}
      </span>
      <div
        className={`${styles.branches} ${
          hasDeepBranch ? styles.branchesStacked : ""
        }`}
      >
        {children.map((child, i) => (
          <div key={child.id} className={styles.branch}>
            <div className={styles.branchChain}>
              <Stage
                node={child}
                pokemonById={pokemonById}
                currentId={currentId}
                lang={lang}
                t={t}
                names={names}
              />
            </div>
            {!sharedLabel && (
              <span className={styles.condition}>{labels[i]}</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default function EvolutionChain({ chainUrl, currentId }) {
  const { t, i18n } = useTranslation();
  const [root, setRoot] = useState(null);
  const [pokemonById, setPokemonById] = useState({});
  const [names, setNames] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tree = await fetchEvolutionChain(chainUrl).catch(() => null);
      if (!tree || cancelled) return;

      // Doppelte Referenzen rauswerfen, sonst holen wir denselben
      // Gegenstand mehrfach.
      const refs = [
        ...new Map(
          collectNamedRefs(tree).map((r) => [`${r[0]}:${r[1]}`, r]),
        ).values(),
      ];

      const [list, nameEntries] = await Promise.all([
        Promise.all(
          collectIds(tree).map((id) => fetchPokemonById(id).catch(() => null)),
        ),
        Promise.all(
          refs.map(async ([kind, slug]) => [
            `${kind}:${slug}`,
            await fetchLocalizedNames(kind, slug).catch(() => null),
          ]),
        ),
      ]);
      if (cancelled) return;

      const map = {};
      list.forEach((p) => {
        if (p) map[p.id] = p;
      });
      const nameMap = {};
      nameEntries.forEach(([key, value]) => {
        if (value) nameMap[key] = value;
      });

      setRoot(tree);
      setPokemonById(map);
      setNames(nameMap);
    }

    setRoot(null);
    load();
    return () => {
      cancelled = true;
    };
  }, [chainUrl]);

  // Kein Baum geladen oder Pokémon entwickelt sich gar nicht
  if (!root || root.next.length === 0) return null;

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{t("evolution.title")}</h2>
      <div className={styles.chain}>
        <Stage
          node={root}
          pokemonById={pokemonById}
          currentId={currentId}
          lang={i18n.language}
          t={t}
          names={names}
        />
      </div>
    </div>
  );
}
