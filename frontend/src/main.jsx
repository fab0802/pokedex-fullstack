import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CollectionProvider } from "./context/CollectionContext";
import { TeamsProvider } from "./context/TeamsContext";
import { ComparisonProvider } from "./context/ComparisonContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PokemonListProvider } from "./context/PokemonListContext";
import { GameProvider } from "./context/GameContext";
import { ToastProvider } from "./context/ToastContext";
import { FilterProvider } from "./context/FilterContext";
import { DisplayProvider } from "./context/DisplayContext";
import { BallThemeProvider } from "./context/BallThemeContext";
import "./index.css";
import "./i18n";
import App from "./App.jsx";

// Wir stellen die Scroll-Position selbst wieder her (siehe PokemonList).
// Die native Wiederherstellung des Browsers läuft asynchron und würde die
// Position beim Zurücknavigieren sonst überschreiben – v. a. beim Browser-
// Zurück-Pfeil auf dem Desktop.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <BallThemeProvider>
            <ToastProvider>
              <GameProvider>
                <CollectionProvider>
                  <TeamsProvider>
                    <ComparisonProvider>
                      <PokemonListProvider>
                        <FilterProvider>
                          <DisplayProvider>
                            <App />
                          </DisplayProvider>
                        </FilterProvider>
                      </PokemonListProvider>
                    </ComparisonProvider>
                  </TeamsProvider>
                </CollectionProvider>
              </GameProvider>
            </ToastProvider>
          </BallThemeProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
