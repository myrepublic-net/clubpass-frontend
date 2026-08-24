import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { readScanToken, verifyScan } from "../api/clubpassUser.js";
import "../css/scan-confirm.css";

/**
 * Which night this was, worked out from what's left. Boardings are rows in
 * clubpass-scan now rather than four named columns, so the response no longer
 * names the night — but four minus the remainder still does.
 */
function nightUsed(tripLeft) {
  const used = 4 - Number(tripLeft ?? 0);
  return ["1st night", "2nd night", "3rd night", "4th night"][used - 1] ?? "—";
}

const timeFormat = new Intl.DateTimeFormat("en-SG", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : timeFormat.format(date);
}

function nights(count) {
  return `${count} ${count === 1 ? "night" : "nights"}`;
}

/** Seconds until the token dies, by the driver's own clock. */
function secondsLeft(payload) {
  if (!payload?.exp) return 0;
  return Math.max(0, Math.round(payload.exp - Date.now() / 1000));
}

/**
 * Where a scanned boarding QR lands. The link carries the member's short-lived
 * token, and the driver spends the night by tapping through — opening the link
 * on its own never costs a trip, so a stray tap or a link preview can't.
 */
export default function ScanConfirm() {
  const [searchParams] = useSearchParams();
  const userName = (searchParams.get("userName") ?? "").trim();
  const token = (searchParams.get("token") ?? "").trim();

  const payload = useMemo(() => readScanToken(token), [token]);
  const valid = Boolean(userName && token && payload?.userName === userName);

  const [flow, setFlow] = useState({ status: "ready" });
  const [countdown, setCountdown] = useState(() => secondsLeft(payload));

  // Only tick while the pass is still waiting to be confirmed — once it's spent
  // the countdown is just noise.
  useEffect(() => {
    if (!valid || flow.status !== "ready") return;

    setCountdown(secondsLeft(payload));
    const timer = setInterval(() => setCountdown(secondsLeft(payload)), 1000);

    return () => clearInterval(timer);
  }, [valid, flow.status, payload]);

  const confirm = useCallback(async () => {
    setFlow({ status: "verifying" });

    try {
      const result = await verifyScan({ userName, token });
      setFlow({ status: "done", result });
    } catch (error) {
      console.error("ClubPass scan failed", error);

      // Scanning is driver-only now. Send them to sign in rather than showing
      // "not boarded", which would read as the member's pass being at fault.
      if (error.code === "NO_DRIVER") {
        setFlow({ status: "needsDriver", message: error.message });
        return;
      }

      setFlow({ status: "failed", message: error.message });
    }
  }, [userName, token]);

  if (!valid) {
    return (
      <Screen tone="bad" mark="!" title="This isn't a Clubpass link">
        <p>Scan the QR code shown in the member's RewardLand app.</p>
      </Screen>
    );
  }

  if (flow.status === "done") {
    const left = flow.result?.tripLeft ?? 0;

    return (
      <Screen tone="good" mark="✓" title="Boarding confirmed">
        <p className="cpv-name">{flow.result?.userName ?? userName}</p>
        <dl className="cpv-facts">
          <div>
            <dt>Night used</dt>
            <dd>{nightUsed(left)}</dd>
          </div>
          <div>
            <dt>Remaining</dt>
            <dd>{nights(left)}</dd>
          </div>
        </dl>
        {left === 0 && <p className="cpv-note">That was the last night on this pass.</p>}
        <p className="cpv-fine">{formatTime(flow.result?.scannedAt)}</p>
      </Screen>
    );
  }

  if (flow.status === "needsDriver") {
    const back = `${window.location.pathname}${window.location.search}`;

    return (
      <Screen tone="bad" mark="!" title="Driver sign-in needed">
        <p>{flow.message}</p>
        <a className="cpv-cta" href={`/driver?next=${encodeURIComponent(back)}`}>
          Go to driver sign-in
        </a>
        <p className="cpv-fine">Sign in once and this link will work for the rest of your shift.</p>
      </Screen>
    );
  }

  if (flow.status === "failed") {
    return (
      <Screen tone="bad" mark="×" title="Not boarded">
        <p>{flow.message}</p>
        <p className="cpv-fine">Ask the member for a fresh QR code and scan again.</p>
      </Screen>
    );
  }

  const expired = countdown <= 0;

  return (
    <Screen tone="neutral" mark="" title="Clubpass">
      <p className="cpv-name">{userName}</p>
      <p className="cpv-left">{nights(payload.tripLeft ?? 0)} left</p>

      <button
        type="button"
        className="cpv-cta"
        onClick={confirm}
        disabled={expired || flow.status === "verifying"}
      >
        {flow.status === "verifying" ? "Confirming…" : "Confirm boarding"}
      </button>

      <p className="cpv-fine">
        {expired ? "This code has expired — ask for a fresh QR." : `Valid for ${countdown}s`}
      </p>
    </Screen>
  );
}

function Screen({ tone, mark, title, children }) {
  return (
    <main className="cpv-page">
      <title>Clubpass boarding</title>
      <meta name="theme-color" content="#14061F" />

      <div className={`cpv-card cpv-card--${tone}`}>
        {mark && (
          <span className="cpv-mark" aria-hidden="true">
            {mark}
          </span>
        )}
        <h1>{title}</h1>
        {children}
      </div>
    </main>
  );
}
