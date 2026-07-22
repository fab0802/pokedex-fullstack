import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchEvolutionChain, fetchPokemonById } from "../services/pokeApi";
import { pokemonName } from "./pokemonName";
import { formatEvolutionCondition } from "./evolutionCondition";
import styles from "./EvolutionChain.module.css";

// Sammelt alle IDs im Baum ein - ebenfalls rekursiv.
function collectIds(node, acc = []) {
  acc.push(node.id);
  node.next.forEach((child) => collectIds(child, acc));
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
function Stage({ node, pokemonById, currentId, lang, t }) {
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
            {formatEvolutionCondition(child.details, t)}
          </span>
        </span>
        <Stage
          node={child}
          pokemonById={pokemonById}
          currentId={currentId}
          lang={lang}
          t={t}
        />
      </>
    );
  }

  return (
    <>
      {sprite}
      <span className={styles.fork}>
        <ChevronRight size={20} aria-hidden="true" />
      </span>
      <div className={styles.branches}>
        {children.map((child) => (
          <div key={child.id} className={styles.branch}>
            <div className={styles.branchChain}>
              <Stage
                node={child}
                pokemonById={pokemonById}
                currentId={currentId}
                lang={lang}
                t={t}
              />
            </div>
            <span className={styles.condition}>
              {formatEvolutionCondition(child.details, t)}
            </span>
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tree = await fetchEvolutionChain(chainUrl).catch(() => null);
      if (!tree || cancelled) return;

      const list = await Promise.all(
        collectIds(tree).map((id) => fetchPokemonById(id).catch(() => null)),
      );
      if (cancelled) return;

      const map = {};
      list.forEach((p) => {
        if (p) map[p.id] = p;
      });
      setRoot(tree);
      setPokemonById(map);
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
        />
      </div>
    </div>
  );
}
