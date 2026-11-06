import { useTranslation } from "react-i18next";
import { useFilter } from "../context/useFilter";
import { useGame } from "../context/useGame";
import styles from "./GameScopeFilter.module.css";

// Schalter für den Spielmodus: nur Pokémon aus dem Dex des gewählten Spiels
// oder alle. Ohne Spielwahl ist die Liste ohnehin komplett -> ausblenden.
export default function GameScopeFilter() {
  const { t } = useTranslation();
  const { onlyInGame, setOnlyInGame } = useFilter();
  const { selectedGame } = useGame();

  if (selectedGame.id === "all") return null;

  const options = [
    { value: true, label: t("filter.gameScope_inGame") },
    { value: false, label: t("filter.gameScope_all") },
  ];

  return (
    <div className={styles.field}>
      <span className={styles.label}>{t("filter.gameScope")}</span>
      <div
        className={styles.segment}
        role="group"
        aria-label={t("filter.gameScope")}
      >
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            className={styles.button}
            data-active={onlyInGame === opt.value}
            onClick={() => setOnlyInGame(opt.value)}
            aria-pressed={onlyInGame === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
