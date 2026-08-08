import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./ScrollToTopButton.module.css";

// Ab wie vielen Pixeln Scroll der Button grundsaetzlich auftauchen darf.
const SHOW_AFTER = 300;

// Nur auf der Detailseite: Der Button erscheint erst, wenn die Seite wirklich
// lang ist - also mehr als DETAIL_MIN_EXTRA_SCREENS zusaetzliche Bildschirme
// scrollbar sind. So bleibt er bei den kurzen Tabs (z. B. Basiswerte) aus und
// verdeckt nichts (Gesamt-Zeile!), taucht aber im langen Attacken-Tab auf.
// Viewport-relativ statt fixer Pixelwert -> geraeteunabhaengig. Bei Bedarf
// lokal nachjustieren (z. B. 0.8 = frueher, 1.5 = spaeter sichtbar).
const DETAIL_MIN_EXTRA_SCREENS = 1;

export default function ScrollToTopButton() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  const isDetail = pathname.startsWith("/pokemon/");

  useEffect(() => {
    function update() {
      const scrolledEnough = window.scrollY > SHOW_AFTER;

      // Alle Seiten ausser Detail: bisheriges Verhalten (nur Scroll-Distanz).
      if (!isDetail) {
        setVisible(scrolledEnough);
        return;
      }

      // Detailseite: zusaetzlich pruefen, ob genug Inhalt zum Scrollen da ist.
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const longEnough =
        scrollable > window.innerHeight * DETAIL_MIN_EXTRA_SCREENS;
      setVisible(scrolledEnough && longEnough);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // Tab-Wechsel aendert die Seitenhoehe ohne Scroll-/Resize-Event
    // -> ResizeObserver faengt das ab und rechnet die Sichtbarkeit neu.
    const observer = new ResizeObserver(update);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [isDetail]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className={styles.button}
          onClick={scrollToTop}
          aria-label={t("common.scrollToTop")}
          title={t("common.scrollToTop")}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowUp aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
