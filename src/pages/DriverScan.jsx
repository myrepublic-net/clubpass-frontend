import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import jsQR from "jsqr";

import { verifyScan } from "../api/clubpassUser.js";
import { readDriverSession, signInDriver, signOutDriver } from "../api/driverAuth.js";
import "../css/driver.css";

/**
 * Driver console — sign in, then scan boarding passes with the phone camera.
 *
 * Deliberately its own page with its own session: the driver is not a ClubPass
 * member, arrives with no rr_sso, and every scan they make is authorised by
 * their Strapi login rather than by the site's API token.
 *
 * The existing /scan page still works — a driver who points their phone's own
 * camera app at a pass lands there. This is for scanning without leaving the
 * page, one pass after another.
 */

/** Chrome and Android have this natively; Safari doesn't, hence the jsQR fallback. */
const nativeDetector =
  typeof window !== "undefined" && "BarcodeDetector" in window
    ? new window.BarcodeDetector({ formats: ["qr_code"] })
    : null;

/** A boarding QR is a link to /scan carrying the member and their scan token. */
function readScan(text) {
  try {
    const url = new URL(text, window.location.origin);
    const userName = url.searchParams.get("userName")?.trim();
    const token = url.searchParams.get("token")?.trim();

    if (userName && token) return { userName, token };
  } catch {
    // Not a URL — some other QR code entirely.
  }

  return null;
}

function SignIn({ onSignedIn }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const submit = async (event) => {
    event.preventDefault();
    setState({ status: "working" });

    try {
      onSignedIn(await signInDriver({ identifier, password }));
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  };

  return (
    <form className="drv-card" onSubmit={submit}>
      <h1>Driver sign-in</h1>
      <p className="drv-sub">Sign in to scan boarding passes.</p>

      <label className="drv-field">
        <span>Username or email</span>
        <input
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
      </label>

      <label className="drv-field">
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {state.status === "error" && <p className="drv-error">{state.message}</p>}

      <button type="submit" className="drv-btn" disabled={state.status === "working"}>
        {state.status === "working" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function Scanner({ driver, onSignOut }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(0);

  // Read inside the animation loop, which is created once — state would be
  // stale in there.
  const busyRef = useRef(false);

  const [state, setState] = useState({ status: "idle" });

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // Whatever happens, the camera light goes off when the driver leaves.
  useEffect(() => stopCamera, [stopCamera]);

  const verify = useCallback(
    async ({ userName, token }) => {
      busyRef.current = true;
      setState({ status: "verifying" });
      stopCamera();

      try {
        const result = await verifyScan({ userName, token });
        setState({ status: "boarded", result });
      } catch (error) {
        if (error.code === "NO_DRIVER") {
          onSignOut();
          return;
        }
        setState({ status: "refused", message: error.message, userName });
      } finally {
        busyRef.current = false;
      }
    },
    [stopCamera, onSignOut],
  );

  const scan = useCallback(async () => {
    setState({ status: "starting" });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // The back camera on a phone; harmless on a laptop, which has one camera.
        video: { facingMode: { ideal: "environment" } },
      });

      streamRef.current = stream;

      const video = videoRef.current;
      video.srcObject = stream;
      // iOS won't play an inline video without this pair set before play().
      video.setAttribute("playsinline", "true");
      video.muted = true;
      await video.play();

      setState({ status: "scanning" });

      const tick = async () => {
        if (!streamRef.current || busyRef.current) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const found = await readFrame(video, canvasRef.current);
          const scanned = found && readScan(found);

          if (scanned) {
            verify(scanned);
            return;
          }
        }

        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    } catch (error) {
      console.error("Camera failed", error);

      setState({
        status: "cameraFailed",
        message:
          error.name === "NotAllowedError"
            ? "Camera access was blocked. Allow it in your browser settings and try again."
            : error.name === "NotFoundError"
              ? "No camera found on this device."
              : "Couldn't open the camera. Make sure this page is on https.",
      });
    }
  }, [verify]);

  const reset = () => {
    setState({ status: "idle" });
  };

  return (
    <div className="drv-card">
      <header className="drv-head">
        <div>
          <h1>Boarding scanner</h1>
          <p className="drv-sub">Signed in as {driver.username}</p>
        </div>
        <button type="button" className="drv-link" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      {/* Kept mounted: the stream is attached to this element, and remounting
          it mid-scan would drop the camera. */}
      <div className={`drv-viewport${state.status === "scanning" ? "" : " is-hidden"}`}>
        <video ref={videoRef} className="drv-video" playsInline muted />
        <div className="drv-reticle" aria-hidden="true" />
      </div>
      <canvas ref={canvasRef} className="drv-canvas" />

      {state.status === "idle" && (
        <>
          <p className="drv-sub">Point the camera at a member's boarding QR.</p>
          <button type="button" className="drv-btn" onClick={scan}>
            Scan boarding pass
          </button>
        </>
      )}

      {state.status === "starting" && <p className="drv-sub">Opening the camera…</p>}

      {state.status === "scanning" && (
        <>
          <p className="drv-sub">Looking for a boarding pass…</p>
          <button type="button" className="drv-btn drv-btn-quiet" onClick={() => { stopCamera(); reset(); }}>
            Cancel
          </button>
        </>
      )}

      {state.status === "verifying" && <p className="drv-sub">Checking the pass…</p>}

      {state.status === "boarded" && (
        <div className="drv-result drv-result-ok">
          <span className="drv-tick" aria-hidden="true">✓</span>
          <h2>Boarded</h2>
          <p className="drv-name">{state.result?.userName}</p>
          <p className="drv-sub">{state.result?.tripLeft} trip(s) left</p>
          <button type="button" className="drv-btn" onClick={scan}>
            Scan next
          </button>
        </div>
      )}

      {state.status === "refused" && (
        <div className="drv-result drv-result-no">
          <span className="drv-cross" aria-hidden="true">×</span>
          <h2>Not boarded</h2>
          <p className="drv-sub">{state.message}</p>
          <button type="button" className="drv-btn" onClick={scan}>
            Try again
          </button>
        </div>
      )}

      {state.status === "cameraFailed" && (
        <>
          <p className="drv-error">{state.message}</p>
          <button type="button" className="drv-btn" onClick={scan}>
            Try again
          </button>
        </>
      )}
    </div>
  );
}

/** One frame, decoded by the browser if it can, by jsQR if it can't. */
async function readFrame(video, canvas) {
  if (nativeDetector) {
    const [first] = await nativeDetector.detect(video).catch(() => []);
    return first?.rawValue ?? null;
  }

  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height) return null;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(video, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);

  return jsQR(data, width, height, { inversionAttempts: "dontInvert" })?.data ?? null;
}

export default function DriverScan() {
  const [searchParams] = useSearchParams();
  const [driver, setDriver] = useState(() => readDriverSession());

  const signOut = useCallback(() => {
    signOutDriver();
    setDriver(null);
  }, []);

  /**
   * /scan sends a driver here with ?next= when they open a pass without being
   * signed in. Only same-site paths are followed — a full URL in there would
   * be an open redirect for anyone who could get a driver to tap a link.
   */
  const signedIn = useCallback(
    (session) => {
      const next = searchParams.get("next");

      if (next && next.startsWith("/") && !next.startsWith("//")) {
        window.location.replace(next);
        return;
      }

      setDriver(session);
    },
    [searchParams],
  );

  return (
    <div className="drv-page">
      <title>Driver scanner | ClubPass</title>
      {driver ? <Scanner driver={driver} onSignOut={signOut} /> : <SignIn onSignedIn={signedIn} />}
    </div>
  );
}
