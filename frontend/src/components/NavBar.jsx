import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  Scale,
  LogOut,
  LogIn,
  UserPlus,
  Search,
  Settings,
  CircleDot,
  SlidersHorizontal,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import ThemeToggle from "./ThemeToggle";
import BallToggle from "./BallToggle";
import LanguageToggle from "./LanguageToggle";
import GlobalSearch from "./GlobalSearch";
import FilterDrawer from "./FilterDrawer";
import GameMode from "./GameMode";
import SortControl from "./SortControl";
import TypeFilter from "./TypeFilter";
import GenerationFilter from "./GenerationFilter";
import CategoryFilter from "./CategoryFilter";
import StatFilter from "./StatFilter";
import CaughtFilter from "./CaughtFilter";
import { useFilter } from "../context/useFilter";
import DisplayControl from "./DisplayControl";
import styles from "./NavBar.module.css";

export default function NavBar() {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const { reset, isActive } = useFilter();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // "/" öffnet die Suche - ausser man tippt gerade in ein Feld
  useEffect(() => {
    function onKey(e) {
      if (e.key !== "/") return;
      const el = document.activeElement;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);
      if (typing) return;
      e.preventDefault();
      setSearchOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Einstellungs-Menü schliessen, wenn man daneben klickt
  useEffect(() => {
    if (!settingsOpen) return;
    function onClickOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [settingsOpen]);

  const tabClass = ({ isActive }) =>
    `${styles.tab} ${isActive ? styles.tabActive : ""}`;

  return (
    <>
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

        {/* Desktop: alle Elemente in der oberen Leiste */}
        <div className={styles.links}>
          <button
            className={`${styles.link} ${styles.searchBtn}`}
            onClick={() => setSearchOpen(true)}
            aria-label={t("search.title")}
          >
            <Search size={17} aria-hidden="true" />
            <span className={styles.label}>{t("search.title")}</span>
          </button>
          <button
            className={`${styles.link} ${styles.searchBtn}`}
            onClick={() => setFilterOpen(true)}
            aria-label={t("filter.title")}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span className={styles.label}>{t("filter.title")}</span>
          </button>
          <GameMode />
          <Link to="/guide" className={styles.link}>
            <BookOpen size={17} aria-hidden="true" />
            <span className={styles.label}>{t("nav.guide")}</span>
          </Link>
          <LanguageToggle />
          <ThemeToggle />
          <BallToggle />
          {isAuthenticated ? (
            <>
              <Link to="/teams" className={styles.link}>
                <Users size={17} aria-hidden="true" />
                <span className={styles.label}>{t("nav.teams")}</span>
              </Link>
              <Link to="/compare" className={styles.link}>
                <Scale size={17} aria-hidden="true" />
                <span className={styles.label}>{t("nav.compare")}</span>
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

        {/* Mobile: Zahnrad mit Sprache + Theme */}
        <div className={styles.settings} ref={settingsRef}>
          <GameMode variant="mobile" />
          <button
            className={styles.gear}
            onClick={() => setFilterOpen(true)}
            aria-label={t("filter.title")}
          >
            <SlidersHorizontal size={20} aria-hidden="true" />
          </button>
          <button
            className={styles.gear}
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label={t("nav.settings")}
            aria-expanded={settingsOpen}
          >
            <Settings size={20} aria-hidden="true" />
          </button>
          {settingsOpen && (
            <div className={styles.settingsMenu}>
              <LanguageToggle variant="menu" />
              <ThemeToggle variant="menu" />
              <BallToggle variant="menu" />
            </div>
          )}
        </div>
      </nav>

      {/* Mobile: untere Tab-Bar */}
      <nav className={styles.tabbar} aria-label={t("nav.menu")}>
        <NavLink to="/" end className={tabClass}>
          <CircleDot size={20} aria-hidden="true" />
          <span>{t("nav.home")}</span>
        </NavLink>
        <button className={styles.tab} onClick={() => setSearchOpen(true)}>
          <Search size={20} aria-hidden="true" />
          <span>{t("search.title")}</span>
        </button>
        <NavLink to="/guide" className={tabClass}>
          <BookOpen size={20} aria-hidden="true" />
          <span>{t("nav.guide")}</span>
        </NavLink>
        {isAuthenticated ? (
          <>
            <NavLink to="/teams" className={tabClass}>
              <Users size={20} aria-hidden="true" />
              <span>{t("nav.teamsShort")}</span>
            </NavLink>
            <NavLink to="/compare" className={tabClass}>
              <Scale size={20} aria-hidden="true" />
              <span>{t("nav.compare")}</span>
            </NavLink>
            <button className={styles.tab} onClick={handleLogout}>
              <LogOut size={20} aria-hidden="true" />
              <span>{t("nav.logout")}</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={tabClass}>
              <LogIn size={20} aria-hidden="true" />
              <span>{t("nav.login")}</span>
            </NavLink>
            <NavLink to="/register" className={tabClass}>
              <UserPlus size={20} aria-hidden="true" />
              <span>{t("nav.register")}</span>
            </NavLink>
          </>
        )}
      </nav>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)}>
        <SortControl />
        <DisplayControl />
        <TypeFilter />
        <GenerationFilter />
        <CategoryFilter />
        <StatFilter />
        <CaughtFilter />
        {isActive && (
          <button type="button" className={styles.filterReset} onClick={reset}>
            {t("filter.reset")}
          </button>
        )}
      </FilterDrawer>
    </>
  );
}
