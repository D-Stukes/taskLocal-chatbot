import TaskLocalDashboard3Col from "./components/TaskLocalDashboard3Col";
import Login from "./components/Login";
import SplashIntro from "./components/SplashIntro";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  if (loading) return null;

  return user
    ? <TaskLocalDashboard3Col user={user} onLogout={() => supabase.auth.signOut()} />
    : <Login />;
}
