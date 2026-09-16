import { useState } from "react";
import { authenticateDemoUser, registerUser, DEMO_USERS } from "../auth/demoUsers";
import { hasSupabaseConfig, supabase } from "../lib/supabase";
import logoUrl from "../assets/tasklocal-logo.png";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSignIn(event) {
    event.preventDefault();
    if (supabase) {
      setError("");
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) setError(authError.message);
      return;
    }
    const user = authenticateDemoUser(email, password);
    if (!user) {
      setError("Incorrect email or password.");
      return;
    }
    setError("");
    onLogin(user);
  }

  async function handleSignUp(event) {
    event.preventDefault();
    if (supabase) {
      setError("");
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() } },
      });
      if (authError) {
        setError(authError.message);
      } else {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
      return;
    }
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
                <button type="submit" className="login-submit compact">
                  Sign in
                </button>
                <button
                  type="button"
                  className="login-submit secondary compact"
                  onClick={() => switchMode("signup")}
                >
                  Sign up
                </button>
                <button type="button" className="login-submit secondary compact" onClick={useDemoCredentials}>
                  Use Demo Account
                </button>
              </>
            ) : (
              <>
                <button type="submit" className="login-submit compact">
                  Create account
                </button>
                <button
                  type="button"
                  className="login-submit secondary compact"
                  onClick={() => switchMode("signin")}
                >
                  Back to sign in
                </button>
              </>
            )}
          </div>
        </form>

        <p className="login-notice">
          {notice || (hasSupabaseConfig
            ? "Sign in with your TaskLocal account."
            : mode === "signin"
            ? "Frontend demo only. Configure Supabase to enable real accounts."
            : "New accounts are saved in this browser only -- not shared across devices yet.")}
        </p>
      </section>
    </main>
  );
}
