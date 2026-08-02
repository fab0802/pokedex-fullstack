import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./FilterDrawer.module.css";

// Wiederverwendbare Hülle: Panel gleitet von rechts herein. Inhalt kommt
// über children, damit hier später Typ-/Stat-Filter + Sortierung andocken.
export default function FilterDrawer({ open, onClose, title, children }) {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();

  // Fokus in den Drawer holen, vorherigen Fokus merken/zurückgeben und den
  // Hintergrund am Scrollen hindern, solange offen.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // Escape schliesst; Tab bleibt im Drawer (einfache Fokus-Falle).
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="filter-backdrop"
          className={styles.backdrop}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.aside
            ref={panelRef}
            className={styles.panel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <div className={styles.header}>
              <h2 id={titleId} className={styles.title}>
                {title ?? t("filter.title")}
              </h2>
              <button
                ref={closeRef}
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label={t("common.close")}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.body}>{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
