import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav>
      <Link to="/">Pokédex</Link>
      {isAuthenticated ? (
        <>
          <Link to="/teams">My Teams</Link>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
