import { useTranslation } from "react-i18next";
import GuidePokemonRow from "./GuidePokemonRow";
import { typeColors } from "./typeColors";
import styles from "./TrainerCard.module.css";

export default function TrainerCard({ trainer }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("de") ? "de" : "en";
  const accent = trainer.type ? typeColors[trainer.type] : "var(--color-primary)";

  return (
    <article className={styles.card} style={{ borderLeftColor: accent }}>
      <header className={styles.header}>
        <span className={styles.name}>{trainer.name[lang]}</span>
        {trainer.city && <span className={styles.city}>{trainer.city[lang]}</span>}

        <span className={styles.meta}>
          {trainer.type ? (
            <span className={styles.type} style={{ backgroundColor: accent }}>
              {t(`types.${trainer.type}`)}
            </span>
          ) : (
            <span className={styles.mixed}>{t("guide.mixed")}</span>
          )}
          {trainer.badge && (
            <span className={styles.badge}>{trainer.badge[lang]}</span>
          )}
        </span>
      </header>

      <div className={styles.team}>
        {trainer.team.map((mon, idx) => (
          <GuidePokemonRow
            key={`${mon.id}-${idx}`}
            id={mon.id}
            level={mon.level}
            ace={mon.ace}
          />
        ))}
      </div>

      {trainer.variants && (
        <div className={styles.variants}>
          <p className={styles.variantsTitle}>{t("guide.starterVariants")}</p>
          {trainer.variants.map((variant, vIdx) => (
            <div key={vIdx} className={styles.variant}>
              <p className={styles.variantLabel}>{variant.label[lang]}</p>
              <div className={styles.team}>
                {variant.team.map((mon, idx) => (
                  <GuidePokemonRow
                    key={`${mon.id}-${idx}`}
                    id={mon.id}
                    level={mon.level}
                    ace={mon.ace}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
