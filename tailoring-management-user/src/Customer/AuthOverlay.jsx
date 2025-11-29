import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AuthOverlay.css";
import tailorBackground from "../assets/tailorbackground.jpg";

const STORAGE_KEY_USER = "tailorUser";
const STORAGE_KEY_LOGGED_IN = "tailorIsLoggedIn";

const AuthOverlay = () => {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (mode === "signup") {
      if (!email || !password || !name) {
        setError("Please fill in all required fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const newUser = { name, email, password };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_LOGGED_IN, "true");
      alert("Account created successfully!");
      navigate("/");
      return;
    }

    // login mode
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (!stored) {
      setError("No account found. Please sign up first.");
      return;
    }
    const user = JSON.parse(stored);
    if (user.email !== email || user.password !== password) {
      setError("Invalid email or password.");
      return;
    }

    localStorage.setItem(STORAGE_KEY_LOGGED_IN, "true");
    alert(`Welcome back, ${user.name}!`);
    navigate("/");
  };

  return (
    <div
      className="auth-overlay"
      style={{ backgroundImage: `url(${tailorBackground})` }}
    >
      <div className="auth-backdrop" onClick={handleClose} />
      <div className="auth-panel">
        <button className="auth-close" type="button" onClick={handleClose}>
          ×
        </button>
        <p className="auth-brand">D&apos;Jackman Tailor Deluxe</p>
        <h2 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to book your next premium tailoring experience."
            : "Join us and personalize every detail of your perfect fit."}
        </p>

        <div className="auth-toggle">
          <button
            type="button"
            className={`auth-toggle-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="auth-field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Jackman"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          {mode === "signup" && (
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button type="submit" className="auth-submit">
            {mode === "login" ? "Login & Book" : "Create Account & Book"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthOverlay;


