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
import "./index.css";
import "./i18n";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CollectionProvider>
            <TeamsProvider>
              <ComparisonProvider>
                <GameProvider>
                  <PokemonListProvider>
                    <FilterProvider>
                      <DisplayProvider>
                        <ToastProvider>
                          <App />
                        </ToastProvider>
                      </DisplayProvider>
                    </FilterProvider>
                  </PokemonListProvider>
                </GameProvider>
              </ComparisonProvider>
            </TeamsProvider>
          </CollectionProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
