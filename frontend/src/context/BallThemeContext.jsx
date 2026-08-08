import { useState, useEffect } from "react";
import { BallThemeContext } from "./ballThemeContextObject";

// Gültige Ball-Designs; "poke" ist der Standard (klassisches Rot).
const BALLS = ["poke", "great", "ultra", "master"];

export function BallThemeProvider({ children }) {
  const [ball, setBallState] = useState(() => {
    const saved = localStorage.getItem("ball");
    return BALLS.includes(saved) ? saved : "poke";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-ball", ball);
  }, [ball]);

  function setBall(newBall) {
    if (!BALLS.includes(newBall)) return;
    localStorage.setItem("ball", newBall);
    setBallState(newBall);
  }

  return (
    <BallThemeContext.Provider value={{ ball, setBall }}>
      {children}
    </BallThemeContext.Provider>
  );
}
