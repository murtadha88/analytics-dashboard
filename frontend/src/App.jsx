import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import AuthPage from "./Components/AuthPage/AuthPage";
import Dashboard from "./Components/Dashboard/Dashboard";
import Navbar from "./Components/Navbar/Navbar";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.is_authenticated) {
        setIsLoggedIn(true);
        setCurrentUser(data);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setMessage("Logged out successfully");
      }
    } catch (err) {
      console.error(err);
      setMessage("Logout failed");
    }
  };

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <div className="app-container">
        <div className="app-card">
          <h1 className="app-title">Analytics Dashboard</h1>
          {message && <p className={`message`}>{message}</p>}

          <Routes>
            <Route
              path="/"
              element={
                isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/auth"
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <AuthPage
                    setIsLoggedIn={setIsLoggedIn}
                    setCurrentUser={setCurrentUser}
                    setMessage={setMessage}
                  />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isLoggedIn ? (
                  <Dashboard currentUser={currentUser} />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
