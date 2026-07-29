import { useContext } from "react";
import { ToastContext } from "./toastContextObject";

export function useToast() {
  return useContext(ToastContext);
}
