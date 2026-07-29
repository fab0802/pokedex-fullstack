import { useState, useRef, useCallback, useEffect } from "react";
import { ToastContext } from "./toastContextObject";
import Toast from "../components/Toast";

const DEFAULT_DURATION = 3000; // ms bis Auto-Dismiss

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map()); // id -> timeoutId

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeoutId = timers.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message, { type = "success", duration = DEFAULT_DURATION } = {}) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      const timeoutId = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, timeoutId);
    },
    [removeToast],
  );

  // Beim Unmount alle laufenden Timer aufräumen (kein Leak / keine späten setState)
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timeoutId) => clearTimeout(timeoutId));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}
