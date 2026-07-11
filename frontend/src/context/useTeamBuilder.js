import { useContext } from "react";
import { TeamBuilderContext } from "./teamBuilderContextObject";

export function useTeamBuilder() {
  return useContext(TeamBuilderContext);
}
