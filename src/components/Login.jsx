import { useState } from "react";
import { authenticateDemoUser, DEMO_USERS } from "../auth/demoUsers";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const user = authenticateDemoUser(email, password);
    if (!user) {
      setError("Incorrect email or password.");
      return;
    }
    setError("");
    onLogin(user);
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">TL</div>
        <p className="login-eyebrow">TaskLocal</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to the chat operations console.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" className="login-submit">Sign in</button>
        </form>
        <div className="demo-credentials">
          <strong>Demo credentials</strong>
          <span>{DEMO_USERS[0].email}</span>
          <span>{DEMO_USERS[0].password}</span>
        </div>
        <p className="login-notice">Frontend demo only. This is not secure authentication yet.</p>
      </section>
    </main>
  );
}
