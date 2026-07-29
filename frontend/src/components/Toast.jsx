import { Check, X } from "lucide-react";
import styles from "./Toast.module.css";

export default function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast} data-type={toast.type}>
          <Check size={16} className={styles.icon} />
          <span className={styles.message}>{toast.message}</span>
          <button
            className={styles.close}
            onClick={() => onDismiss(toast.id)}
            aria-label="Schliessen"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
