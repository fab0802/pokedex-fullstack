import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import redBlue from "../data/trainers/redBlue.json";
import yellow from "../data/trainers/yellow.json";
import goldSilver from "../data/trainers/goldSilver.json";
import rubySapphire from "../data/trainers/rubySapphire.json";
import diamondPearl from "../data/trainers/diamondPearl.json";
import blackWhite from "../data/trainers/blackWhite.json";
import xy from "../data/trainers/xy.json";
import sunMoon from "../data/trainers/sunMoon.json";
import TrainerCard from "./TrainerCard";
import styles from "./GameGuide.module.css";

// Aktuell nur ein Guide - bewusst als Liste angelegt, damit weitere Spiele
// später nur ergänzt werden müssen: Datendatei importieren und hier eintragen.
const GUIDES = [redBlue, yellow, goldSilver, rubySapphire, diamondPearl, blackWhite, xy, sunMoon];

const CATEGORY_ORDER = [
  "gym",
  "gymJohto",
  "kahuna",
  "eliteFour",
  "champion",
  "gymKanto",
  "superBoss",
];
const CATEGORY_KEY = {
  gym: "guide.gyms",
  gymJohto: "guide.gymsJohto",
  kahuna: "guide.kahuna",
  eliteFour: "guide.eliteFour",
  champion: "guide.champion",
  gymKanto: "guide.gymsKanto",
  superBoss: "guide.superBoss",
};

export default function GameGuide() {
  const { t, i18n } = useTranslation();
  const [gameId, setGameId] = useState(GUIDES[0].game);
  const lang = i18n.language.startsWith("de") ? "de" : "en";

  const guide = GUIDES.find((g) => g.game === gameId) ?? GUIDES[0];

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <h1 className={styles.title}>
          <BookOpen size={22} aria-hidden="true" />
          {t("guide.title")}
        </h1>
        <select
          className={styles.gameSelect}
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          aria-label={t("guide.selectGame")}
        >
          {GUIDES.map((g) => (
            <option key={g.game} value={g.game}>
              {g.label[lang]}
            </option>
          ))}
        </select>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const trainers = guide.trainers.filter((tr) => tr.category === cat);
        if (trainers.length === 0) return null;
        return (
          <section key={cat} className={styles.section}>
            <h2 className={styles.sectionTitle}>{t(CATEGORY_KEY[cat])}</h2>
            <div className={styles.cards}>
              {trainers.map((tr) => (
                <TrainerCard key={tr.key} trainer={tr} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
