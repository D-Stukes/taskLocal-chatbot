import TaskLocalDashboard3Col from "./components/TaskLocalDashboard3Col";
import Login from "./components/Login";
import SplashIntro from "./components/SplashIntro";
import { useState } from "react";

const SESSION_KEY = "tasklocal-demo-session";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  });
  // Show the jingle splash once per tab. sessionStorage keeps a soft reload
  // (or any App re-render) from replaying it, while a brand-new visit still
  // gets the intro.
  const [introDone, setIntroDone] = useState(() => {
    try {
      return sessionStorage.getItem("tl-intro-seen") === "1";
    } catch {
      return false;
    }
  });

  function handleLogin(nextUser) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  if (!introDone) {
    return (
      <SplashIntro
        onDone={() => {
          try {
            sessionStorage.setItem("tl-intro-seen", "1");
          } catch {
            // sessionStorage unavailable (private mode, etc.) — no problem,
            // the intro just won't be suppressed on the next reload.
          }
          setIntroDone(true);
        }}
      />
    );
  }

  return user ? (
    <TaskLocalDashboard3Col user={user} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}
