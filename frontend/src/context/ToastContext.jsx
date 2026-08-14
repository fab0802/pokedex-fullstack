import { useState, useRef, useCallback, useEffect } from "react";
import { ToastContext } from "./toastContextObject";
import Toast from "../components/Toast";

const DEFAULT_DURATION = 3000; // ms bis Auto-Dismiss

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // id -> { timeoutId, remaining, startedAt }
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const entry = timers.current.get(id);
    if (entry?.timeoutId) clearTimeout(entry.timeoutId);
    timers.current.delete(id);
  }, []);

  const showToast = useCallback(
    (message, { type = "success", duration = DEFAULT_DURATION } = {}) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      const timeoutId = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, {
        timeoutId,
        remaining: duration,
        startedAt: Date.now(),
      });
    },
    [removeToast],
  );

  // Timer anhalten, solange der Toast berührt wird / die Maus darüberliegt.
  // Restzeit wird gemerkt, damit resume dort weitermacht, wo pause aufgehört hat.
  const pauseToast = useCallback((id) => {
    const entry = timers.current.get(id);
    if (!entry || entry.timeoutId == null) return; // schon pausiert oder weg
    clearTimeout(entry.timeoutId);
    const elapsed = Date.now() - entry.startedAt;
    entry.remaining = Math.max(0, entry.remaining - elapsed);
    entry.timeoutId = null;
  }, []);

  // Timer mit der verbleibenden Restzeit fortsetzen.
  const resumeToast = useCallback(
    (id) => {
      const entry = timers.current.get(id);
      if (!entry || entry.timeoutId != null) return; // läuft bereits
      entry.startedAt = Date.now();
      entry.timeoutId = setTimeout(() => removeToast(id), entry.remaining);
    },
    [removeToast],
  );

  // Beim Unmount alle laufenden Timer aufräumen (kein Leak / keine späten setState)
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((entry) => entry.timeoutId && clearTimeout(entry.timeoutId));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        toasts={toasts}
        onDismiss={removeToast}
        onPause={pauseToast}
        onResume={resumeToast}
      />
    </ToastContext.Provider>
  );
}
