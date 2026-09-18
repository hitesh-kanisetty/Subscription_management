import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
// import "./Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" || location.pathname==="/forgot-password" || location.pathname==="/verify-otp" || location.pathname==="/reset-password";
const isHomePage = location.pathname === "/";
  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* =========================
     LOGIN / SIGNUP NAVBAR
     ========================= */

  if (isAuthPage) {
    return (
      <header className="auth-header">
        <div className="auth-nav-wrap">

          <Link
            to="/"
            className="auth-brand"
            aria-label="SubFlow home"
          >
            <span className="auth-brand-mark">
              <img
                src="/subflow-logo.png"
                alt="SubFlow logo"
              />
            </span>

            <span>SubFlow</span>
          </Link>

          <Link
            to="/"
            className="auth-home-link"
          >
            ← Back to Home
          </Link>

        </div>
      </header>
    );
  }

  /* =========================
     LANDING PAGE NAVBAR
     ========================= */

  return (
    <header className="site-header">
      <div className="container nav-wrap">

        <Link
          to="/"
          className="brand"
          aria-label="SubFlow home"
        >
          <span className="brand-mark">
            <img
              src="/subflow-logo.png"
              alt="SubFlow logo"
            />
          </span>

          <span>SubFlow</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="desktop-nav"
          aria-label="Primary navigation"
        >
           <a
    href="#home"
    className={isHomePage ? "active" : ""}
  >
    Home
  </a>

          <a href="#features">Features</a>

          <a href="#journey">How It Works</a>

          <a href="#contact">Contact</a>
        </nav>

        {/* Desktop Actions */}
        <div className="nav-actions">
          <Link to="/login">
            Login
          </Link>

          <Link
            to="/signup"
            className="button button-small"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu */}
        <button
          className="menu-button"
          aria-label={
            menuOpen ? "Close menu" : "Open menu"
          }
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          <a href="#home" onClick={closeMenu}>
            Home
          </a>

          <a href="#features" onClick={closeMenu}>
            Features
          </a>

          <a href="#journey" onClick={closeMenu}>
            How It Works
          </a>

          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>

          <Link to="/login" onClick={closeMenu}>
            Login
          </Link>

          <Link to="/signup" onClick={closeMenu}>
            Sign Up
          </Link>
        </nav>
      )}
    </header>
  );
}