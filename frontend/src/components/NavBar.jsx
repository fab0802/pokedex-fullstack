import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, LogOut, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/useAuth";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import styles from "./NavBar.module.css";

export default function NavBar() {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.brand}>
        <svg
          className={styles.brandIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
          <path d="M3 12h6" />
          <path d="M15 12h6" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Pokédex
      </Link>
      <div className={styles.links}>
        <LanguageToggle />
        <ThemeToggle />
        {isAuthenticated ? (
          <>
            <Link to="/teams" className={styles.link}>
              <Users size={17} aria-hidden="true" />
              <span className={styles.label}>{t("nav.teams")}</span>
            </Link>
            <button onClick={handleLogout} className={styles.logout}>
              <LogOut size={16} aria-hidden="true" />
              <span className={styles.label}>{t("nav.logout")}</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.link}>
              <LogIn size={17} aria-hidden="true" />
              <span className={styles.label}>{t("nav.login")}</span>
            </Link>
            <Link to="/register" className={styles.link}>
              <UserPlus size={17} aria-hidden="true" />
              <span className={styles.label}>{t("nav.register")}</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
