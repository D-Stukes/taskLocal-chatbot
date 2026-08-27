import TaskLocalDashboard3Col from "./components/TaskLocalDashboard3Col";
import Login from "./components/Login";
import SplashIntro from "./components/SplashIntro";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
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
        if (!session?.user) setProfile(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) setProfile(null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileError("");
      return;
    }

    let mounted = true;
    setProfileError("");
    supabase
      .from("profiles")
      .select("id, display_name, role, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setProfileError(error.message);
          return;
        }
        setProfile(data);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

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
  if (profileError) {
    return (
      <main className="login-shell">
        <section className="login-card" aria-labelledby="profile-error-title">
          <h1 id="profile-error-title">Unable to load your profile</h1>
          <p className="login-subtitle">{profileError}</p>
          <button type="button" className="login-submit" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return user
    ? <TaskLocalDashboard3Col user={{ ...user, profile }} onLogout={() => supabase.auth.signOut()} />
    : <Login />;
}
