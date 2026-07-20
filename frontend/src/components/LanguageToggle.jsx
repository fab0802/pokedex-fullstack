import { useTranslation } from "react-i18next";
import styles from "./LanguageToggle.module.css";

const LANGS = ["en", "de"];

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("de") ? "de" : "en";

  return (
    <div className={styles.group}>
      {LANGS.map((lng) => (
        <button
          key={lng}
          className={`${styles.button} ${current === lng ? styles.active : ""}`}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
