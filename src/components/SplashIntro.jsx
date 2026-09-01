import { useEffect, useRef, useState } from "react";
import jingleUrl from "../assets/tasklocal-jingle.m4a";
import logoUrl from "../assets/tasklocal-logo.png";

// How long the splash stays up before it fades into the app, once its
// assets are actually ready to play. The jingle file is ~14s; we don't hold
// the user that long — it plays under the splash and gets faded out when we
// leave.
const SPLASH_MS = 4500;

// Safety valve: if the logo or jingle somehow never finish loading (flaky
// connection, blocked request), don't leave the visitor stuck on a bare
// background forever -- start the splash anyway after this long.
const ASSET_WAIT_MAX_MS = 6000;

// One TaskLocal jingle per visit. This component owns the only <audio> in the
// app, and both the play() call and the hand-off to the app are guarded so
// they can't fire twice — including under React 18 StrictMode, which mounts,
// unmounts, and remounts every component once in development.
export default function SplashIntro({ onDone }) {
  const audioRef = useRef(null);
  const startedRef = useRef(false); // has playback been kicked off already?
  const finishedRef = useRef(false); // has onDone already been called?
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finishRef = useRef(() => {});

  const [leaving, setLeaving] = useState(false);
  // Have the logo and jingle actually finished loading? Starting the splash's
  // fixed timer before they're ready lets a slow connection eat into the
  // window, cutting the animation and jingle short. We wait for both first.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let imgLoaded = false;
    let audioLoaded = false;

    const maybeReady = () => {
      if (!cancelled && imgLoaded && audioLoaded) setReady(true);
    };

    const img = new Image();
    img.onload = () => {
      imgLoaded = true;
      maybeReady();
    };
    img.onerror = () => {
      // Don't block the splash forever over a broken image request.
      imgLoaded = true;
      maybeReady();
    };
    img.src = logoUrl;

    const audio = audioRef.current;
    const onCanPlay = () => {
      audioLoaded = true;
      maybeReady();
    };
    if (audio) {
      if (audio.readyState >= 3) {
        audioLoaded = true;
      } else {
        audio.addEventListener("canplaythrough", onCanPlay);
      }
    } else {
      audioLoaded = true;
    }
    maybeReady();

    const fallback = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, ASSET_WAIT_MAX_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      if (audio) audio.removeEventListener("canplaythrough", onCanPlay);
    };
  }, []);

  useEffect(() => {
    if (!ready) return; // hold off starting the countdown until assets are loaded

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const audio = audioRef.current;
      if (audio) {
        // Quick fade so the jingle doesn't cut off abruptly.
        const fade = window.setInterval(() => {
          if (audio.volume > 0.1) {
            audio.volume = Math.max(0, audio.volume - 0.1);
          } else {
            window.clearInterval(fade);
            audio.pause();
          }
        }, 40);
      }

      setLeaving(true);
      window.setTimeout(() => onDoneRef.current?.(), 450); // let the fade-out play
    };

    finishRef.current = finish;
    const timer = window.setTimeout(finish, SPLASH_MS);

    const audio = audioRef.current;
    if (audio && !startedRef.current) {
      startedRef.current = true;
      audio.volume = 1;
      const attempt = audio.play();
      // Autoplay with sound is blocked until the user interacts with the page
      // in most browsers. That's fine — the splash still shows and still hands
      // off to the app on the timer.
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {});
      }
    }

    return () => window.clearTimeout(timer);
  }, [ready]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center"
      style={{
        background:
          "linear-gradient(180deg, #0F1B2E 0%, #16233A 55%, #1B2B44 100%)",
        transition: "opacity 0.45s ease",
        opacity: leaving ? 0 : 1,
      }}
    >
      <style>{`
        @keyframes tl-splash-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          20% { transform: translateY(-24px) scale(1.02); }
          40% { transform: translateY(0) scale(0.98); }
          60% { transform: translateY(-12px) scale(1.01); }
          80% { transform: translateY(0) scale(1); }
        }
        @keyframes tl-splash-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <audio ref={audioRef} src={jingleUrl} preload="auto" />

      {ready && (
        <>
          <img
            src={logoUrl}
            alt="TaskLocal"
            style={{
              width: "180px",
              height: "auto",
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))",
              animation: "tl-splash-bounce 1.1s ease-in-out infinite",
            }}
          />

          <h1
            className="text-3xl sm:text-4xl font-bold mt-10"
            style={{
              color: "#F5F3EE",
              fontFamily: "'Space Grotesk', sans-serif",
              animation: "tl-splash-fade 0.6s ease both",
            }}
          >
            TaskLocal at your service!
          </h1>
          <p
            className="text-sm sm:text-base mt-3 max-w-md"
            style={{ color: "#7C93B3", animation: "tl-splash-fade 0.6s ease 0.1s both" }}
          >
            Local cleaning, handyman, and moving help — matched, booked, and looked
            after in one place.
          </p>
        </>
      )}

      <button
        type="button"
        onClick={() => (ready ? finishRef.current() : onDoneRef.current?.())}
        className="mt-12 text-xs uppercase"
        style={{
          color: "#7C93B3",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          letterSpacing: "0.16em",
        }}
      >
        Skip →
      </button>
    </div>
  );
}
