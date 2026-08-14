import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { readScanToken, verifyScan } from "../api/clubpassUser.js";
import "../css/scan-confirm.css";

const SCAN_NAMES = {
  firstScan: "1st night",
  secondScan: "2nd night",
  thirdScan: "3rd night",
  fourthScan: "4th night",
};

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
      setFlow({ status: "failed", message: error.message });
    }
  }, [userName, token]);

  if (!valid) {
    return (
      <Screen tone="bad" mark="!" title="This isn't a ClubPass link">
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
            <dd>{SCAN_NAMES[flow.result?.scan] ?? "—"}</dd>
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
    <Screen tone="neutral" mark="" title="ClubPass">
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
      <title>ClubPass boarding</title>
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
