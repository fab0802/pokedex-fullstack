import { Routes, Route } from "react-router-dom";
import PokemonList from "./components/PokemonList";
import PokemonDetail from "./components/PokemonDetail";
import Register from "./components/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PokemonList />} />
      <Route path="/pokemon/:id" element={<PokemonDetail />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
