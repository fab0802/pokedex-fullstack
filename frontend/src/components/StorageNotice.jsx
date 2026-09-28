import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import styles from "./StorageNotice.module.css";

// Einmaliger Hinweis zur lokalen Speicherung. Die App nutzt keine Cookies,
// nur localStorage für technisch notwendige Daten (Login, Einstellungen,
// Cache) -> reiner Hinweis, keine Zustimmung nötig.
// Lokaler State statt Context: nur diese Komponente braucht den Wert.
const STORAGE_KEY = "storageNoticeSeen";

export default function StorageNotice() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== "1",
  );

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          className={styles.notice}
          aria-label={t("storageNotice.label")}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
        >
          <p className={styles.text}>{t("storageNotice.text")}</p>
          <button type="button" className={styles.button} onClick={dismiss}>
            {t("storageNotice.ok")}
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
