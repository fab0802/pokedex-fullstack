import { Routes, Route } from "react-router-dom";
import PokemonList from "./components/PokemonList";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PokemonList />} />
    </Routes>
  );
}

export default App;
