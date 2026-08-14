import {
  Check,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./Toast.module.css";

const ICONS = {
  success: Check,
  neutral: Trash2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

// Der Container orchestriert den Stagger: erscheinen mehrere Toasts gleichzeitig,
// blenden sie mit ~400 ms Versatz nacheinander ein.
const containerVariants = {
  show: { transition: { staggerChildren: 0.4 } },
};

const toastVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export default function Toast({ toasts, onDismiss, onPause, onResume }) {
  if (toasts.length === 0) return null;

  return (
    <motion.div
      className={styles.container}
      role="status"
      aria-live="polite"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* popLayout: verschwindende Toasts fallen sofort aus dem Fluss,
          sodass die verbleibenden per layout sanft nachrücken. */}
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] ?? Check;
          return (
            <motion.div
              key={toast.id}
              layout
              className={styles.toast}
              data-type={toast.type}
              variants={toastVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={{
                layout: { type: "spring", stiffness: 500, damping: 40 },
              }}
              onMouseEnter={() => onPause?.(toast.id)}
              onMouseLeave={() => onResume?.(toast.id)}
              onTouchStart={() => onPause?.(toast.id)}
              onTouchEnd={() => onResume?.(toast.id)}
              onTouchCancel={() => onResume?.(toast.id)}
            >
              <Icon size={16} className={styles.icon} />
              <span className={styles.message}>{toast.message}</span>
              <button
                className={styles.close}
                onClick={() => onDismiss(toast.id)}
                aria-label="Schliessen"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
