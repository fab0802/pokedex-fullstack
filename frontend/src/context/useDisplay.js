import { useContext } from "react";
import { DisplayContext } from "./displayContextObject";

export function useDisplay() {
  return useContext(DisplayContext);
}
