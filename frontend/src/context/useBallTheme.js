import { useContext } from "react";
import { BallThemeContext } from "./ballThemeContextObject";

export function useBallTheme() {
  return useContext(BallThemeContext);
}
