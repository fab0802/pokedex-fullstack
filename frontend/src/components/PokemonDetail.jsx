import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPokemonById } from "../services/pokeApi";
import { useAuth } from "../context/useAuth";
import { useCollection } from "../context/useCollection";

export default function PokemonDetail() {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const { isCaught, toggleCaught } = useCollection();

  useEffect(() => {
    fetchPokemonById(id)
      .then(setPokemon)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!pokemon) return <p>Loading...</p>;
  return (
    <div>
      <h1>
        #{pokemon.id} {pokemon.name}
      </h1>
      {isAuthenticated && (
        <button onClick={() => toggleCaught(pokemon.id)}>
          {isCaught(pokemon.id) ? "Caught ✓" : "Not caught"}
        </button>
      )}
      <img src={pokemon.image} alt={pokemon.name} width={200} />
      <p>Height: {pokemon.height / 10} m</p>
      <p>Weight: {pokemon.weight / 10} kg</p>
      <ul>
        {pokemon.stats.map((s) => (
          <li key={s.name}>
            {s.name}: {s.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
