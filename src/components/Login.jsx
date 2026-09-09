import { useState } from "react";
import { authenticateDemoUser, registerUser, DEMO_USERS } from "../auth/demoUsers";
import logoUrl from "../assets/tasklocal-logo.png";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function handleSignIn(event) {
    event.preventDefault();
    const user = authenticateDemoUser(email, password);
    if (!user) {
      setError("Incorrect email or password.");
      return;
    }
    setError("");
    onLogin(user);
  }

  function handleSignUp(event) {
    event.preventDefault();
    try {
      const user = registerUser(email, password, name);
      setError("");
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  function useDemoCredentials() {
    setEmail(DEMO_USERS[0].email);
    setPassword(DEMO_USERS[0].password);
    setError("");
    setMode("signin");
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="tl-logo-frame" aria-hidden="true">
          <img src={logoUrl} alt="" />
        </div>
        <p className="login-eyebrow">TaskLocal</p>
        <h1 id="login-title">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="login-subtitle">
          {mode === "signin"
            ? "Sign in to the chat operations console."
            : "Sign up to get started with the chat operations console."}
        </p>

        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="login-form">
          {mode === "signup" && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "signin" ? "Enter your password" : "At least 6 characters"}
              required
            />
          </label>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <div className="login-btn-row">
            {mode === "signin" ? (
              <>
                <button type="submit" className="login-submit">
                  Sign in
                </button>
                <button
                  type="button"
                  className="login-submit secondary"
                  onClick={() => switchMode("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                <button type="submit" className="login-submit">
                  Create account
                </button>
                <button
                  type="button"
                  className="login-submit secondary"
                  onClick={() => switchMode("signin")}
                >
                  Back to sign in
                </button>
              </>
            )}
          </div>
        </form>

        <div className="demo-credentials">
          <strong>Demo credentials (same password for all)</strong>
          {DEMO_USERS.map((user) => (
            <span key={user.email}>{user.email}</span>
          ))}
          <span>Password: {DEMO_USERS[0].password}</span>
          <button type="button" className="demo-fill" onClick={useDemoCredentials}>
            Use demo account
          </button>
        </div>
        <p className="login-notice">
          {mode === "signin"
            ? "Frontend demo only. This is not secure authentication yet."
            : "New accounts are saved in this browser only -- not shared across devices yet."}
        </p>
      </section>
    </main>
  );
}
