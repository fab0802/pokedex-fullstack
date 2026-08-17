import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import redBlue from "../data/trainers/redBlue.json";
import yellow from "../data/trainers/yellow.json";
import goldSilver from "../data/trainers/goldSilver.json";
import rubySapphire from "../data/trainers/rubySapphire.json";
import fireredLeafgreen from "../data/trainers/fireredLeafgreen.json";
import diamondPearl from "../data/trainers/diamondPearl.json";
import blackWhite from "../data/trainers/blackWhite.json";
import xy from "../data/trainers/xy.json";
import sunMoon from "../data/trainers/sunMoon.json";
import swordShield from "../data/trainers/swordShield.json";
import scarletViolet from "../data/trainers/scarletViolet.json";
import TrainerCard from "./TrainerCard";
import { useGame } from "../context/useGame";
import styles from "./GameGuide.module.css";

// Aktuell nur ein Guide - bewusst als Liste angelegt, damit weitere Spiele
// später nur ergänzt werden müssen: Datendatei importieren und hier eintragen.
const GUIDES = [
  redBlue,
  yellow,
  goldSilver,
  rubySapphire,
  fireredLeafgreen,
  diamondPearl,
  blackWhite,
  xy,
  sunMoon,
  swordShield,
  scarletViolet,
];

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

// Remakes haben (noch) keinen eigenen Guide, teilen aber die Region mit einem
// bestehenden Spiel. Bis eigene Remake-Guides existieren, zeigen wir den
// regionspassenden Guide statt des generischen Fallbacks auf den ersten Eintrag.
const REMAKE_GUIDE_FALLBACK = {
  hgss: "gold-silver",
  oras: "ruby-sapphire",
};

function guideIdForGame(selectedGame) {
  const vgs = selectedGame?.versionGroups ?? [];
  const match = GUIDES.find((g) => vgs.includes(g.game));
  if (match) return match.game;
  const remake = REMAKE_GUIDE_FALLBACK[selectedGame?.id];
  return remake ?? GUIDES[0].game;
}

export default function GameGuide() {
  const { t, i18n } = useTranslation();
  const { selectedGame } = useGame();
  const lang = i18n.language.startsWith("de") ? "de" : "en";

  // Hybrid: ohne Override folgt die Seite live dem globalen Spiel (abgeleitet,
  // kein Effect nötig - fängt auch das async-Nachladen nach dem Login ab).
  // Ein manueller Selektor-Klick überschreibt nur lokal, ohne den globalen
  // Wert zu verändern.
  const [override, setOverride] = useState(null);
  const gameId = override ?? guideIdForGame(selectedGame);

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
          onChange={(e) => setOverride(e.target.value)}
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
