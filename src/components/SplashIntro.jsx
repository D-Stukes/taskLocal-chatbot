import { useEffect, useRef, useState } from "react";
import jingleUrl from "../assets/tasklocal-jingle.m4a";
import exclamationUrl from "../assets/tasklocal-exclamation.m4a";
import logoUrl from "../assets/tasklocal-logo.png";

// Safety valve: if the logo or jingle somehow never finish loading (flaky
// connection, blocked request), don't leave the visitor stuck on a bare
// background forever -- let them through anyway after this long.
const ASSET_WAIT_MAX_MS = 6000;

// How long before the jingle's real end the marching pieces should already
// be locked back into one whole logo (covers the piece-reassembly CSS
// transition plus a small cushion, so it visibly *finishes* settling right
// as the music stops, instead of still snapping into place after).
const REASSEMBLE_LEAD_MS = 900;
const FALLBACK_JINGLE_MS = 14000; // used only if duration can't be read

// After the pieces settle back in the corner, how long to pause there
// before heading to the center for the exclamation beat.
const CORNER_PAUSE_MS = 1000;

// One TaskLocal jingle per visit. This component owns both audio elements,
// and every stage (tap, jingle end, exclamation end) is guarded so nothing
// can fire twice -- including under React 18 StrictMode's dev double-mount.
export default function SplashIntro({ onDone }) {
  const jingleRef = useRef(null);
  const exclaimRef = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const startedRef = useRef(false);
  const piecesLockedRef = useRef(false);
  const finishedRef = useRef(false);

  const [assetsReady, setAssetsReady] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle -> entering -> shattered -> settled -> centering -> done

  // Preload the logo + jingle so tapping in doesn't stutter waiting on
  // either to arrive.
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
      imgLoaded = true; // don't block the splash forever over a broken image request
      maybeReady();
    };
    img.src = logoUrl;

    const audio = jingleRef.current;
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

  function lockPiecesTogether() {
    if (piecesLockedRef.current) return;
    piecesLockedRef.current = true;
    setPhase("settled"); // pieces animate back to the grid slot AND the box heads to the corner together
  }

  function handleEnter() {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("entering");

    const audio = jingleRef.current;
    if (audio) {
      audio.volume = 1;
      const attempt = audio.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
      audio.addEventListener("ended", onJingleEnded, { once: true });
    }

    window.setTimeout(() => setPhase("shattered"), 700);

    const scheduleLock = (durationMs) => {
      const delay = Math.max(0, durationMs - REASSEMBLE_LEAD_MS);
      window.setTimeout(lockPiecesTogether, delay);
    };
    if (audio && audio.readyState >= 1 && isFinite(audio.duration) && audio.duration > 0) {
      scheduleLock(audio.duration * 1000);
    } else if (audio) {
      audio.addEventListener(
        "loadedmetadata",
        () => {
          if (isFinite(audio.duration) && audio.duration > 0) scheduleLock(audio.duration * 1000);
          else scheduleLock(FALLBACK_JINGLE_MS);
        },
        { once: true }
      );
      window.setTimeout(() => {
        if (!piecesLockedRef.current) scheduleLock(FALLBACK_JINGLE_MS);
      }, 300);
    } else {
      scheduleLock(FALLBACK_JINGLE_MS);
    }
  }

  function handleSkip() {
    lockPiecesTogether();
    onJingleEnded();
  }

  function onJingleEnded() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    lockPiecesTogether(); // safety net in case timing estimate was off

    const audio = jingleRef.current;
    if (audio) {
      let vol = audio.volume;
      const fade = window.setInterval(() => {
        if (vol > 0.1) {
          vol -= 0.1;
          audio.volume = Math.max(0, vol);
        } else {
          window.clearInterval(fade);
          audio.pause();
        }
      }, 40);
    }

    window.setTimeout(() => {
      setPhase("centering");
      const excl = exclaimRef.current;
      if (excl) {
        excl.volume = 1;
        const attempt = excl.play();
        if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
        excl.addEventListener("ended", finish, { once: true });
      }
      window.setTimeout(finish, 3000); // fallback in case the exclamation clip fails to fire "ended"
    }, CORNER_PAUSE_MS);
  }

  const doneRef = useRef(false);
  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current?.();
  }

  const isCenterish = phase === "entering" || phase === "shattered" || phase === "centering";
  const boxClass = isCenterish ? "center" : "corner";
  const shatteredClass = phase === "shattered" ? " tl-shattered" : "";

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: "linear-gradient(180deg, #0F1B2E 0%, #16233A 55%, #1B2B44 100%)",
        cursor: phase === "idle" ? "pointer" : "default",
      }}
      onClick={phase === "idle" ? handleEnter : undefined}
    >
      <style>{`
        .tl-logo-box {
          position: fixed;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          transition: top .7s cubic-bezier(.34,1.56,.64,1),
                      left .7s cubic-bezier(.34,1.56,.64,1),
                      width .7s cubic-bezier(.34,1.56,.64,1),
                      height .7s cubic-bezier(.34,1.56,.64,1),
                      transform .7s cubic-bezier(.34,1.56,.64,1);
        }
        .tl-logo-box.corner { top: 24px; left: 24px; width: 70px; height: 70px; transform: translate(0,0); }
        .tl-logo-box.center { top: 32%; left: 50%; width: 190px; height: 190px; transform: translate(-50%,-50%); }

        .tl-piece {
          background-image: url(${logoUrl});
          background-size: 300% 300%;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,.35));
          transition: transform .55s cubic-bezier(.34,1.56,.64,1);
          transform: translate(0,0) rotate(0deg);
        }
        .tl-p0 { background-position: 0% 0%; }
        .tl-p1 { background-position: 50% 0%; }
        .tl-p2 { background-position: 100% 0%; }
        .tl-p3 { background-position: 0% 50%; }
        .tl-p4 { background-position: 50% 50%; }
        .tl-p5 { background-position: 100% 50%; }
        .tl-p6 { background-position: 0% 100%; }
        .tl-p7 { background-position: 50% 100%; }
        .tl-p8 { background-position: 100% 100%; }

        .tl-shattered .tl-p0 { animation: tl-run0 3.0s ease-in-out infinite alternate; animation-delay: 0.00s; }
        .tl-shattered .tl-p1 { animation: tl-run1 2.8s ease-in-out infinite alternate; animation-delay: 0.30s; }
        .tl-shattered .tl-p2 { animation: tl-run2 3.2s ease-in-out infinite alternate; animation-delay: 0.60s; }
        .tl-shattered .tl-p3 { animation: tl-run3 2.9s ease-in-out infinite alternate; animation-delay: 0.90s; }
        .tl-shattered .tl-p4 { animation: tl-run4 3.1s ease-in-out infinite alternate; animation-delay: 1.20s; }
        .tl-shattered .tl-p5 { animation: tl-run5 2.7s ease-in-out infinite alternate; animation-delay: 1.50s; }
        .tl-shattered .tl-p6 { animation: tl-run6 3.3s ease-in-out infinite alternate; animation-delay: 1.80s; }
        .tl-shattered .tl-p7 { animation: tl-run7 2.9s ease-in-out infinite alternate; animation-delay: 2.10s; }
        .tl-shattered .tl-p8 { animation: tl-run8 3.0s ease-in-out infinite alternate; animation-delay: 2.40s; }

        @keyframes tl-run0 { 0%{transform:translate(-50vw,40vh) rotate(-4deg);} 10%{transform:translate(-40vw,28vh) rotate(3deg);} 20%{transform:translate(-30vw,40vh) rotate(-4deg);} 30%{transform:translate(-20vw,28vh) rotate(3deg);} 40%{transform:translate(-10vw,40vh) rotate(-4deg);} 50%{transform:translate(0vw,28vh) rotate(3deg);} 60%{transform:translate(10vw,40vh) rotate(-4deg);} 70%{transform:translate(20vw,28vh) rotate(3deg);} 80%{transform:translate(30vw,40vh) rotate(-4deg);} 90%{transform:translate(40vw,28vh) rotate(3deg);} 100%{transform:translate(50vw,40vh) rotate(-4deg);} }
        @keyframes tl-run1 { 0%{transform:translate(-48vw,43vh) rotate(3deg);} 10%{transform:translate(-38vw,31vh) rotate(-4deg);} 20%{transform:translate(-28vw,43vh) rotate(3deg);} 30%{transform:translate(-18vw,31vh) rotate(-4deg);} 40%{transform:translate(-8vw,43vh) rotate(3deg);} 50%{transform:translate(2vw,31vh) rotate(-4deg);} 60%{transform:translate(12vw,43vh) rotate(3deg);} 70%{transform:translate(22vw,31vh) rotate(-4deg);} 80%{transform:translate(32vw,43vh) rotate(3deg);} 90%{transform:translate(42vw,31vh) rotate(-4deg);} 100%{transform:translate(48vw,43vh) rotate(3deg);} }
        @keyframes tl-run2 { 0%{transform:translate(-52vw,46vh) rotate(-4deg);} 10%{transform:translate(-42vw,34vh) rotate(3deg);} 20%{transform:translate(-32vw,46vh) rotate(-4deg);} 30%{transform:translate(-22vw,34vh) rotate(3deg);} 40%{transform:translate(-12vw,46vh) rotate(-4deg);} 50%{transform:translate(-2vw,34vh) rotate(3deg);} 60%{transform:translate(8vw,46vh) rotate(-4deg);} 70%{transform:translate(18vw,34vh) rotate(3deg);} 80%{transform:translate(28vw,46vh) rotate(-4deg);} 90%{transform:translate(38vw,34vh) rotate(3deg);} 100%{transform:translate(52vw,46vh) rotate(-4deg);} }
        @keyframes tl-run3 { 0%{transform:translate(-46vw,37vh) rotate(3deg);} 10%{transform:translate(-36vw,25vh) rotate(-4deg);} 20%{transform:translate(-26vw,37vh) rotate(3deg);} 30%{transform:translate(-16vw,25vh) rotate(-4deg);} 40%{transform:translate(-6vw,37vh) rotate(3deg);} 50%{transform:translate(4vw,25vh) rotate(-4deg);} 60%{transform:translate(14vw,37vh) rotate(3deg);} 70%{transform:translate(24vw,25vh) rotate(-4deg);} 80%{transform:translate(34vw,37vh) rotate(3deg);} 90%{transform:translate(44vw,25vh) rotate(-4deg);} 100%{transform:translate(46vw,37vh) rotate(3deg);} }
        @keyframes tl-run4 { 0%{transform:translate(-50vw,49vh) rotate(-4deg);} 10%{transform:translate(-40vw,37vh) rotate(3deg);} 20%{transform:translate(-30vw,49vh) rotate(-4deg);} 30%{transform:translate(-20vw,37vh) rotate(3deg);} 40%{transform:translate(-10vw,49vh) rotate(-4deg);} 50%{transform:translate(0vw,37vh) rotate(3deg);} 60%{transform:translate(10vw,49vh) rotate(-4deg);} 70%{transform:translate(20vw,37vh) rotate(3deg);} 80%{transform:translate(30vw,49vh) rotate(-4deg);} 90%{transform:translate(40vw,37vh) rotate(3deg);} 100%{transform:translate(50vw,49vh) rotate(-4deg);} }
        @keyframes tl-run5 { 0%{transform:translate(-48vw,41vh) rotate(3deg);} 10%{transform:translate(-38vw,29vh) rotate(-4deg);} 20%{transform:translate(-28vw,41vh) rotate(3deg);} 30%{transform:translate(-18vw,29vh) rotate(-4deg);} 40%{transform:translate(-8vw,41vh) rotate(3deg);} 50%{transform:translate(2vw,29vh) rotate(-4deg);} 60%{transform:translate(12vw,41vh) rotate(3deg);} 70%{transform:translate(22vw,29vh) rotate(-4deg);} 80%{transform:translate(32vw,41vh) rotate(3deg);} 90%{transform:translate(42vw,29vh) rotate(-4deg);} 100%{transform:translate(48vw,41vh) rotate(3deg);} }
        @keyframes tl-run6 { 0%{transform:translate(-53vw,44vh) rotate(-4deg);} 10%{transform:translate(-43vw,32vh) rotate(3deg);} 20%{transform:translate(-33vw,44vh) rotate(-4deg);} 30%{transform:translate(-23vw,32vh) rotate(3deg);} 40%{transform:translate(-13vw,44vh) rotate(-4deg);} 50%{transform:translate(-3vw,32vh) rotate(3deg);} 60%{transform:translate(7vw,44vh) rotate(-4deg);} 70%{transform:translate(17vw,32vh) rotate(3deg);} 80%{transform:translate(27vw,44vh) rotate(-4deg);} 90%{transform:translate(37vw,32vh) rotate(3deg);} 100%{transform:translate(53vw,44vh) rotate(-4deg);} }
        @keyframes tl-run7 { 0%{transform:translate(-47vw,47vh) rotate(3deg);} 10%{transform:translate(-37vw,35vh) rotate(-4deg);} 20%{transform:translate(-27vw,47vh) rotate(3deg);} 30%{transform:translate(-17vw,35vh) rotate(-4deg);} 40%{transform:translate(-7vw,47vh) rotate(3deg);} 50%{transform:translate(3vw,35vh) rotate(-4deg);} 60%{transform:translate(13vw,47vh) rotate(3deg);} 70%{transform:translate(23vw,35vh) rotate(-4deg);} 80%{transform:translate(33vw,47vh) rotate(3deg);} 90%{transform:translate(43vw,35vh) rotate(-4deg);} 100%{transform:translate(47vw,47vh) rotate(3deg);} }
        @keyframes tl-run8 { 0%{transform:translate(-51vw,38vh) rotate(-4deg);} 10%{transform:translate(-41vw,26vh) rotate(3deg);} 20%{transform:translate(-31vw,38vh) rotate(-4deg);} 30%{transform:translate(-21vw,26vh) rotate(3deg);} 40%{transform:translate(-11vw,38vh) rotate(-4deg);} 50%{transform:translate(-1vw,26vh) rotate(3deg);} 60%{transform:translate(9vw,38vh) rotate(-4deg);} 70%{transform:translate(19vw,26vh) rotate(3deg);} 80%{transform:translate(29vw,38vh) rotate(-4deg);} 90%{transform:translate(39vw,26vh) rotate(3deg);} 100%{transform:translate(51vw,38vh) rotate(-4deg);} }

        @keyframes tl-splash-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <audio ref={jingleRef} src={jingleUrl} preload="auto" />
      <audio ref={exclaimRef} src={exclamationUrl} preload="auto" />

      {assetsReady && (
        <div className={`tl-logo-box ${boxClass}${shatteredClass}`}>
          <div className="tl-piece tl-p0" />
          <div className="tl-piece tl-p1" />
          <div className="tl-piece tl-p2" />
          <div className="tl-piece tl-p3" />
          <div className="tl-piece tl-p4" />
          <div className="tl-piece tl-p5" />
          <div className="tl-piece tl-p6" />
          <div className="tl-piece tl-p7" />
          <div className="tl-piece tl-p8" />
        </div>
      )}

      {assetsReady && phase === "idle" && (
        <>
          <h1
            className="text-3xl sm:text-4xl font-bold mt-10"
            style={{ color: "#F5F3EE", fontFamily: "'Space Grotesk', sans-serif", animation: "tl-splash-fade 0.6s ease both" }}
          >
            Tap anywhere to enter
          </h1>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEnter();
            }}
            className="mt-12 text-xs uppercase"
            style={{ color: "#7C93B3", background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.16em" }}
          >
            Enter →
          </button>
        </>
      )}

      {assetsReady && phase !== "idle" && (
        <>
          <h1
            className="text-3xl sm:text-4xl font-bold mt-10"
            style={{ color: "#F5F3EE", fontFamily: "'Space Grotesk', sans-serif", animation: "tl-splash-fade 0.6s ease both" }}
          >
            TaskLocal at your service!
          </h1>
          <p
            className="text-sm sm:text-base mt-3 max-w-md"
            style={{ color: "#7C93B3", animation: "tl-splash-fade 0.6s ease 0.1s both" }}
          >
            Local cleaning, handyman, and moving help — matched, booked, and looked after in one place.
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            className="mt-12 text-xs uppercase"
            style={{ color: "#7C93B3", background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.16em" }}
          >
            Skip →
          </button>
        </>
      )}
    </div>
  );
}
