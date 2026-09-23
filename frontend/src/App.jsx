import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PokemonList from "./components/PokemonList";
import PokemonDetail from "./components/PokemonDetail";
import GameGuide from "./components/GameGuide";
import TypeChart from "./components/TypeChart";
import Register from "./components/Register";
import Login from "./components/Login";
import NavBar from "./components/NavBar";
import Teams from "./components/Teams";
import Comparison from "./components/Comparison";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { useAuth } from "./context/useAuth";
import { useToast } from "./context/useToast";

// Lazy: moves.json ist gross und wird nur auf dieser Seite gebraucht.
// Vite packt die Seite samt JSON in ein eigenes Chunk, das erst beim
// ersten Besuch von /moves geladen wird.
const MovesList = lazy(() => import("./components/MovesList"));

function App() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Zentrale Reaktion auf 401 aus dem API-Layer (apiFetch feuert das Event).
  // Steht hier, weil App innerhalb aller Provider liegt und so Auth, Toast
  // und Navigation gleichzeitig zur Verfügung hat.
  useEffect(() => {
    function handleUnauthorized() {
      // Guard: parallele Requests können mehrere 401-Events feuern.
      // Nach dem ersten Logout ist kein Token mehr da -> Rest ignorieren
      // (verhindert doppelten Redirect/Toast).
      if (!localStorage.getItem("token")) return;
      logout();
      navigate("/login");
      showToast(t("auth.sessionExpired"), { type: "info" });
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout, navigate, showToast, t]);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<PokemonList />} />
        <Route path="/pokemon/:id" element={<PokemonDetail />} />
        <Route path="/guide" element={<GameGuide />} />
        <Route path="/types" element={<TypeChart />} />
        <Route
          path="/moves"
          element={
            <Suspense fallback={null}>
              <MovesList />
            </Suspense>
          }
        />
        <Route path="/teams" element={<Teams />} />
        <Route path="/compare" element={<Comparison />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <ScrollToTopButton />
    </>
  );
}

export default App;
