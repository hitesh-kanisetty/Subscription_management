"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container nav-wrap">

        <a
          href="#home"
          className="brand"
          aria-label="SubFlow home"
        >
          <span className="brand-mark">
            <img src="/subflow-logo.png" alt="SubFlow logo" />
          </span>

          <span>SubFlow</span>
        </a>

        <nav
          className="desktop-nav"
          aria-label="Primary navigation"
        >
          <a className="active" href="#home">
            Home
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#journey">
            How It Works
          </a>

          <a href="#contact">
            Contact
          </a>
        </nav>

        <div className="nav-actions">
          <a href="#contact">
            Login
          </a>

          <a
            href="#get-started"
            className="button button-small"
          >
            Sign Up
          </a>
        </div>

        <button
          className="menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

      </div>

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

          <a href="#contact" onClick={closeMenu}>
            Login
          </a>

          <a href="#get-started" onClick={closeMenu}>
            Sign Up
          </a>
        </nav>
      )}
    </header>
  );
}