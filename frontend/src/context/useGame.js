import { useContext } from "react";
import { GameContext } from "./gameContextObject";

export function useGame() {
  return useContext(GameContext);
}
