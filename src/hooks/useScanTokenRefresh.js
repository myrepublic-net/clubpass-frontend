import { useEffect, useState } from "react";

import { findUserByUserName } from "../api/clubpassUser.js";

/** Swap the token this long before it dies, so a QR is never scanned cold. */
const REFRESH_MARGIN_SECONDS = 5;

/** How soon to try again after a failed refresh — a stale QR beats no QR, briefly. */
const RETRY_SECONDS = 55;

/**
 * Keeps the member's scan token fresh. Tokens only live a minute, so the pass
 * quietly fetches a new one — and the current trip count with it — shortly
 * before each expires.
 *
 * Returns the seconds left until that next call, which the pass shows so a
 * member can see their code is live rather than frozen.
 *
 * Deliberately one timer for the whole app: the pass and the post-payment
 * success screen can both be on screen at once, and only one of them should be
 * doing the fetching.
 */
export default function useScanTokenRefresh(user, setUser) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [failures, setFailures] = useState(0);

  const userName = user?.userName ?? "";
  const token = user?.token ?? "";
  const ttl = Number(user?.tokenExpiresIn) || 60;

  useEffect(() => {
    // No token means nothing to keep alive — an unpaid or used-up pass.
    if (!userName || !token) {
      setSecondsLeft(0);
      return;
    }

    // Counting down from the TTL Strapi reported, rather than the token's own
    // expiry, keeps this right on a device whose clock is off.
    let remaining = failures
      ? RETRY_SECONDS
      : Math.max(ttl - REFRESH_MARGIN_SECONDS, RETRY_SECONDS);

    setSecondsLeft(remaining);

    let cancelled = false;

    const timer = setInterval(() => {
      remaining -= 1;

      if (remaining > 0) {
        setSecondsLeft(remaining);
        return;
      }

      clearInterval(timer);
      setSecondsLeft(0);

      findUserByUserName(userName).then(
        (fresh) => {
          if (cancelled) return;

          if (fresh) {
            setFailures(0);
            setUser(fresh);
          } else {
            setFailures((count) => count + 1);
          }
        },
        (error) => {
          console.error("ClubPass token refresh failed", error);
          if (!cancelled) setFailures((count) => count + 1);
        },
      );
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [userName, token, ttl, failures, setUser]);

  return secondsLeft;
}
