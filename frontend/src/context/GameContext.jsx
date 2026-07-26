import { useState } from "react";
import { GameContext } from "./gameContextObject";
import { games } from "../components/games";

export function GameProvider({ children }) {
  const [selectedGame, setSelectedGame] = useState(games[0]);

  return (
    <GameContext.Provider value={{ selectedGame, setSelectedGame }}>
      {children}
    </GameContext.Provider>
  );
}
