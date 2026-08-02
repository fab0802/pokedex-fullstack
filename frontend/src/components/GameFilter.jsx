import { useTranslation } from "react-i18next";
import { games } from "./games";
import { useGame } from "../context/useGame";
import styles from "./GameFilter.module.css";

// Spiel-Auswahl als eigenständiges Filter-Steuerelement. Sitzt jetzt im
// FilterDrawer und ist damit von jeder Seite aus erreichbar.
export default function GameFilter() {
  const { t } = useTranslation();
  const { selectedGame, setSelectedGame } = useGame();

  function handleChange(e) {
    const game = games.find((g) => g.id === e.target.value);
    if (game) setSelectedGame(game);
  }

  return (
    <div className={styles.field}>
      <label htmlFor="gameFilter" className={styles.label}>
        {t("filter.game")}
      </label>
      <select
        id="gameFilter"
        className={styles.select}
        value={selectedGame.id}
        onChange={handleChange}
        aria-label={t("filter.game")}
      >
        {games.map((g) => (
          <option key={g.id} value={g.id}>
            {t(`games.${g.id}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
