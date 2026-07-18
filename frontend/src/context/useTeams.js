import { useContext } from "react";
import { TeamsContext } from "./teamsContextObject";

export function useTeams() {
  return useContext(TeamsContext);
}
