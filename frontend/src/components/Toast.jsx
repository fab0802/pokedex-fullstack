import {
  Check,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import styles from "./Toast.module.css";

const ICONS = {
  success: Check,
  neutral: Trash2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export default function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] ?? Check;
        return (
          <div key={toast.id} className={styles.toast} data-type={toast.type}>
            <Icon size={16} className={styles.icon} />
            <span className={styles.message}>{toast.message}</span>
            <button
              className={styles.close}
              onClick={() => onDismiss(toast.id)}
              aria-label="Schliessen"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
