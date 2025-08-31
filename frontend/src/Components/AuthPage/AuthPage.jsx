import React, { useState } from "react";
import './AuthPage.css';

const AuthPage = ({ setIsLoggedIn, setCurrentUser, setMessage }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? "login" : "signup";
    setMessage("");

    try {
      const res = await fetch(`http://localhost:5000/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      setMessage(data.message);

      if (res.ok) {
        setIsLoggedIn(true);
        setCurrentUser(data);
      }
    } catch (err) {
      console.error(err);
      setMessage("Auth failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLoginView ? "Login" : "Signup"}</h2>
      <form onSubmit={handleAuth}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="primary-btn">
          {isLoginView ? "Log In" : "Sign Up"}
        </button>
      </form>
      <p>
        {isLoginView ? "Don't have an account?" : "Already have an account?"}
        <button onClick={() => setIsLoginView(!isLoginView)} className="link-btn">
          {isLoginView ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
};

export default AuthPage;
