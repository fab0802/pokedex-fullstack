import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import allNames from "../data/pokemonNames.json";
import { pokemonName } from "./pokemonName";
import { usePokemonList } from "../context/usePokemonList";
import styles from "./GlobalSearch.module.css";

export default function GlobalSearch({ onClose }) {
  const { t, i18n } = useTranslation();
  const { ids } = usePokemonList();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // Nur Pokémon aus dem aktuell gewählten Spiel-Dex zulassen
  const idSet = useMemo(() => new Set(ids), [ids]);

  // Beim Öffnen direkt ins Suchfeld fokussieren
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape schliesst das Overlay
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Sucht in beiden Sprachen und nur innerhalb des aktuellen Spiels
  const q = query.trim().toLowerCase();
  const matches = q
    ? allNames
        .filter(
          (p) =>
            idSet.has(p.id) &&
            (p.name.includes(q) || p.nameDe.toLowerCase().includes(q)),
        )
        .slice(0, 8)
    : [];

  function handleSelect(id) {
    navigate(`/pokemon/${id}`);
    onClose();
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("search.title")}
      >
        <div className={styles.inputRow}>
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches[0]) handleSelect(matches[0].id);
            }}
          />
          <button
            className={styles.close}
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>
        {q && matches.length === 0 && (
          <p className={styles.empty}>{t("search.noResults")}</p>
        )}
        {matches.length > 0 && (
          <ul className={styles.results}>
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  className={styles.result}
                  onClick={() => handleSelect(p.id)}
                >
                  <span className={styles.resultId}>#{p.id}</span>
                  <span className={styles.resultName}>
                    {pokemonName(p, i18n.language)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
