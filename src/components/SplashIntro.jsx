import { useEffect, useRef, useState } from "react";
import jingleUrl from "../assets/tasklocal-jingle.m4a";
import logoUrl from "../assets/tasklocal-logo.png";

// How long the animated splash stays up before it fades into the app, once
// it has actually started (after the visitor taps in). The jingle file is
// ~14s; we don't hold the user that long — it plays under the splash and
// gets faded out when we leave.
const SPLASH_MS = 5500;

// Safety valve: if the logo or jingle somehow never finish loading (flaky
// connection, blocked request), don't leave the visitor stuck on a bare
// background forever -- let them through anyway after this long.
const ASSET_WAIT_MAX_MS = 6000;

// One TaskLocal jingle per visit. This component owns the only <audio> in the
// app. Browsers block audio with sound from playing until the visitor has
// actually interacted with the page, so this shows a "tap to enter" step
// first -- that tap is what lets the jingle play reliably everywhere, rather
// than being silently blocked on a fresh visit.
export default function SplashIntro({ onDone }) {
  const audioRef = useRef(null);
  const startedRef = useRef(false); // has playback been kicked off already?
  const finishedRef = useRef(false); // has onDone already been called?
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finishRef = useRef(() => {});

  const [leaving, setLeaving] = useState(false);
  // Have the logo and jingle actually finished loading? Letting the visitor
  // tap in before they're ready would mean the animation/jingle still get
  // cut short by a slow connection, so we wait for both first.
  const [assetsReady, setAssetsReady] = useState(false);
  // Has the visitor tapped "Click Here to Enter" yet? That tap is what lets
  // the jingle play with sound.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let imgLoaded = false;
    let audioLoaded = false;

    const maybeReady = () => {
      if (!cancelled && imgLoaded && audioLoaded) setAssetsReady(true);
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
      if (!cancelled) setAssetsReady(true);
    }, ASSET_WAIT_MAX_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      if (audio) audio.removeEventListener("canplaythrough", onCanPlay);
    };
  }, []);

  useEffect(() => {
    if (!started) return; // hold off starting the countdown until the visitor has tapped in

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

    return () => window.clearTimeout(timer);
  }, [started]);

  // Called directly from the tap, in the same click event -- this is what
  // makes browsers treat the jingle as user-initiated and let it play with
  // sound, instead of silently blocking it.
  function handleEnter() {
    const audio = audioRef.current;
    if (audio && !startedRef.current) {
      startedRef.current = true;
      audio.volume = 1;
      const attempt = audio.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {});
      }
    }
    setStarted(true);
  }

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

        .tl-logo-frame {
          width: 148px;
          height: 148px;
          border-radius: 16px;
          background: rgb(249, 252, 212);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          border: 6px solid #E5352B;
          box-shadow:
            inset 0 0 0 6px #39FF14,
            0 0 0 9px rgb(14, 48, 97),
            0 0 0 11px #B8860B;
          filter: drop-shadow(0 6px 18px rgba(0,0,0,0.35));
        }
        .tl-logo-frame img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .tl-logo-frame.tl-bounce {
          animation: tl-splash-bounce 1.1s ease-in-out infinite;
        }

        .tl-created-by {
          color: #A8D8FF;
        }

        .tl-enter-btn {
          position: relative;
          overflow: hidden;
          margin-top: 40px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.04em;
          color: #F0FBFF;
          background: linear-gradient(145deg, #3a3a40, #17171a 55%, #2c2c32);
          border: none;
          border-radius: 14px;
          padding: 15px 30px;
          cursor: pointer;
          animation: tl-splash-fade 0.6s ease 0.2s both, tl-neon-pulse 2.6s ease-in-out infinite;
        }
        .tl-enter-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 48%;
          background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 100%);
          border-radius: 14px 14px 0 0;
          pointer-events: none;
        }
        @keyframes tl-neon-pulse {
          0%, 100% {
            box-shadow:
              0 0 10px 2px rgba(0,229,255,0.55),
              0 0 22px 6px rgba(255,0,229,0.32),
              inset 0 1px 0 rgba(255,255,255,0.18),
              inset 0 -3px 5px rgba(0,0,0,0.55);
          }
          50% {
            box-shadow:
              0 0 15px 4px rgba(255,0,229,0.6),
              0 0 30px 10px rgba(0,229,255,0.42),
              inset 0 1px 0 rgba(255,255,255,0.22),
              inset 0 -3px 5px rgba(0,0,0,0.55);
          }
        }
        .tl-enter-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: -60%;
          width: 40%;
          height: 100%;
          background: linear-gradient(120deg,
            transparent 0%,
            rgba(200,200,210,0.15) 18%,
            rgba(200,200,210,0.55) 35%,
            rgba(255,255,255,0.95) 50%,
            rgba(200,200,210,0.55) 65%,
            rgba(200,200,210,0.15) 82%,
            transparent 100%);
          transform: skewX(-20deg);
          animation: tl-shine 6s linear infinite;
        }
        @keyframes tl-shine {
          0% { left: -60%; }
          100% { left: 130%; }
        }
        .tl-enter-btn:hover { filter: brightness(1.08); }

        .tl-skip-btn {
          margin-top: 48px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #7C93B3;
          background: transparent;
          border: none;
          cursor: pointer;
        }
      `}</style>

      <audio ref={audioRef} src={jingleUrl} preload="auto" />

      {assetsReady && (
        <>
          <div className={`tl-logo-frame${started ? " tl-bounce" : ""}`}>
            <img src={logoUrl} alt="TaskLocal" />
          </div>

          {!started ? (
            <>
              <h1
                className="text-3xl sm:text-4xl font-bold mt-10"
                style={{
                  color: "#F5F3EE",
                  fontFamily: "'Space Grotesk', sans-serif",
                  animation: "tl-splash-fade 0.6s ease both",
                }}
              >
                Welcome to TaskLocal-Chatbot App
              </h1>
              <p
                className="tl-created-by text-sm sm:text-base mt-3 max-w-md"
                style={{ animation: "tl-splash-fade 0.6s ease 0.1s both" }}
              >
                Created by Diane Stukes, AI Builder
              </p>

              <button type="button" onClick={handleEnter} className="tl-enter-btn">
                Click Here to Enter
              </button>
            </>
          ) : (
            <>
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

              <button type="button" onClick={() => finishRef.current()} className="tl-skip-btn">
                Skip →
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
