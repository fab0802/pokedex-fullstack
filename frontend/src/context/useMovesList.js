import { useContext } from "react";
import { MovesListContext } from "./movesListContextObject";

export function useMovesList() {
  return useContext(MovesListContext);
}
