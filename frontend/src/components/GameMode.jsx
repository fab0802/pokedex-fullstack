import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Gamepad2, Check } from "lucide-react";
import { games } from "./games";
import { useGame } from "../context/useGame";
import styles from "./GameMode.module.css";

// Spielmodus als globaler Umschalter: icon-basierter Button in der Menueleiste,
// der ein Popover mit der Spielauswahl oeffnet. Konzeptionell KEIN Filter,
// sondern der aktive Spiel-Kontext, der jede Ansicht rahmt.
// variant="mobile" -> icon-only (obere Leiste), sonst Icon + Label (Desktop).
export default function GameMode({ variant }) {
  const { t } = useTranslation();
  const { selectedGame, setSelectedGame } = useGame();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const isMobile = variant === "mobile";
  const isAll = selectedGame.id === "all";
  // Aktives Spiel im Klartext zeigen; ohne Auswahl den generischen Modus-Namen.
  const label = isAll ? t("nav.gameMode") : t(`games.${selectedGame.id}`);

  // Schliessen bei Klick ausserhalb + Escape (analog zum Settings-Menue).
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(game) {
    setSelectedGame(game);
    setOpen(false);
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${isMobile ? styles.triggerMobile : styles.trigger} ${
          !isAll ? styles.active : ""
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.gameMode")}
        title={label}
      >
        <Gamepad2 size={isMobile ? 20 : 17} aria-hidden="true" />
        {!isMobile && <span className={styles.label}>{label}</span>}
        {isMobile && !isAll && <span className={styles.dot} aria-hidden="true" />}
      </button>

      {open && (
        <div
          className={`${styles.menu} ${isMobile ? styles.menuEnd : styles.menuStart}`}
          role="menu"
        >
          <p className={styles.menuTitle}>{t("nav.gameMode")}</p>
          {games.map((g) => {
            const selected = g.id === selectedGame.id;
            return (
              <button
                key={g.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`${styles.item} ${selected ? styles.itemActive : ""}`}
                onClick={() => choose(g)}
              >
                <span>{t(`games.${g.id}`)}</span>
                {selected && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
