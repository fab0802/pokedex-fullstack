import { useTranslation } from "react-i18next";
import { useFilter } from "../context/useFilter";
import { useAuth } from "../context/useAuth";
import styles from "./CaughtFilter.module.css";

const OPTIONS = ["all", "caught", "uncaught"];

export default function CaughtFilter() {
  const { t } = useTranslation();
  const { caughtStatus, setCaughtStatus } = useFilter();
  const { isAuthenticated } = useAuth();

  // Fangstatus existiert nur mit Login (Collection ist an das Konto gebunden).
  if (!isAuthenticated) return null;

  return (
    <div className={styles.field}>
      <span className={styles.label}>{t("filter.caughtStatus")}</span>
      <div
        className={styles.segment}
        role="group"
        aria-label={t("filter.caughtStatus")}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            className={styles.button}
            data-active={caughtStatus === opt}
            onClick={() => setCaughtStatus(opt)}
            aria-pressed={caughtStatus === opt}
          >
            {t(`filter.caught_${opt}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
