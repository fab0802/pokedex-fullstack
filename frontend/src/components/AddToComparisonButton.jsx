import { Scale, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useComparison } from "../context/useComparison";
import { useToast } from "../context/useToast";
import styles from "./AddToComparisonButton.module.css";

// Toggle-Button für die eine Vergleichsliste. Zwei Formen:
//  - Standard (mit Label) für die Detailseite
//  - compact (nur Icon) für die Listenkarte
export default function AddToComparisonButton({
  pokemonId,
  pokemonName,
  compact = false,
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isInComparison, addToComparison, removeFromComparison } =
    useComparison();

  const id = Number(pokemonId);
  const inList = isInComparison(id);
  const label = inList ? t("comparison.added") : t("comparison.add");

  async function handleClick(e) {
    // Auf der Listenkarte steckt der Button in einem <Link> – Navigation stoppen.
    e.preventDefault();
    e.stopPropagation();
    try {
      if (inList) {
        await removeFromComparison(id);
        showToast(t("comparison.removeToast", { name: pokemonName }), {
          type: "neutral",
        });
      } else {
        await addToComparison(id);
        showToast(t("comparison.addToast", { name: pokemonName }));
      }
    } catch (err) {
      showToast(err.message, { type: "error" });
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        className={styles.compact}
        data-active={inList}
        onClick={handleClick}
        aria-pressed={inList}
        aria-label={label}
        title={label}
      >
        <Scale size={18} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.button}
      data-active={inList}
      onClick={handleClick}
      aria-pressed={inList}
    >
      {inList ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Scale size={16} aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
