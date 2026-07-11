import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CollectionProvider } from "./context/CollectionContext";
import { TeamBuilderProvider } from "./context/TeamBuilderContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CollectionProvider>
          <TeamBuilderProvider>
            <App />
          </TeamBuilderProvider>
        </CollectionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
