import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ isLoggedIn, handleLogout }) => (
  <nav className="navbar">
    <span className="navbar-logo">📊 Dashboard</span>
    <ul className="navbar-links">
      {isLoggedIn && (
        <>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </li>
        </>
      )}
      {!isLoggedIn && (
        <li>
          <Link to="/auth">Login / Signup</Link>
        </li>
      )}
    </ul>
  </nav>
);

export default Navbar;
