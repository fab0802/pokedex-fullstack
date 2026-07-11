import { Routes, Route } from "react-router-dom";
import PokemonList from "./components/PokemonList";
import PokemonDetail from "./components/PokemonDetail";
import Register from "./components/Register";
import Login from "./components/Login";
import NavBar from "./components/NavBar";
import Teams from "./components/Teams";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<PokemonList />} />
        <Route path="/pokemon/:id" element={<PokemonDetail />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
