import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { resolveClubpassUser } from "../api/clubpassUser.js";
import {
  SSO_PARAM,
  clearSsoSession,
  readSsoSession,
  stripSsoFromUrl,
  validateSsoToken,
} from "../api/sso.js";
import useScanTokenRefresh from "../hooks/useScanTokenRefresh.js";
import { ClubpassUserContext, ScanCountdownContext } from "./clubpassUserContext.js";
import "../css/user-gate.css";

const APP_LINK = "https://rewardland.onelink.me/EwIe/start";

/** What we tell the member when their SSO link doesn't get them in. */
const SSO_MESSAGES = {
  UNAUTHORIZED: "This link has expired. Please try again from the RewardLand app.",
  ACCOUNT_DEACTIVATED: "This RewardLand account is no longer active.",
};

const SSO_FALLBACK_MESSAGE =
  "We couldn't sign you in just now. Please try again from the RewardLand app.";

function Loader() {
  return (
    <div className="cpg-gate">
      <div className="cpg-spinner" role="status" aria-label="Loading your ClubPass" />
      <p className="cpg-loading-text">Loading your ClubPass…</p>
    </div>
  );
}

/** No token and no session — the member got here outside the app. */
function Register() {
  return (
    <div className="cpg-gate">
      <div className="cpg-card">
        <span className="cpg-mark" aria-hidden="true" />
        <h1>Register with RewardLand</h1>
        <p>ClubPass lives inside the RewardLand app. Create your account first, then open ClubPass from there.</p>
        <a className="cpg-cta" href={APP_LINK} target="_blank" rel="noopener noreferrer">
          Get the RewardLand app
        </a>
        <p className="cpg-fine">Already registered? Open ClubPass from inside the app.</p>
      </div>
    </div>
  );
}

/** There was a token, but it didn't get them in. The token is already gone from the URL. */
function SsoFailed({ message }) {
  return (
    <div className="cpg-gate">
      <div className="cpg-card">
        <span className="cpg-mark" aria-hidden="true" />
        <h1>Please try again</h1>
        <p>{message}</p>
        <a className="cpg-cta" href={APP_LINK} target="_blank" rel="noopener noreferrer">
          Open the RewardLand app
        </a>
        <p className="cpg-fine">Reloading this page won't help — the link has to come from the app.</p>
      </div>
    </div>
  );
}

/**
 * Keyed by token so StrictMode's double-effect, a remount or a re-render can't
 * spend the same rr_sso against the Lambda twice.
 */
const inFlight = new Map();

function validateOnce(rrSso) {
  let pending = inFlight.get(rrSso);

  if (!pending) {
    pending = validateSsoToken(rrSso);
    // A network blip shouldn't poison a retry — only successes stay cached.
    pending.catch(() => inFlight.delete(rrSso));
    inFlight.set(rrSso, pending);
  }

  return pending;
}

/**
 * Gates the ClubPass page on a RewardLand SSO sign-in. The only way in is
 * ?rr_sso= from the app: the token goes to our Lambda, and on success the
 * profile it returns is kept in a session cookie so a reload doesn't need a
 * second token. Either way the token leaves the URL as soon as the Lambda has
 * answered.
 *
 * Once we know who the member is, we show the loader while looking them up in
 * Strapi (creating them if they're new), then the page either way: a failed
 * lookup leaves the user null rather than keeping someone out of the page.
 */
export default function UserGate({ children }) {
  const [searchParams] = useSearchParams();
  const ssoToken = searchParams.get(SSO_PARAM)?.trim() ?? "";

  const [state, setState] = useState({ status: "loading" });

  const setUser = useCallback((user) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const value = useMemo(
    () => ({
      userName: state.profile?.username ?? "",
      user: state.user ?? null,
      profile: state.profile ?? null,
      setUser,
    }),
    [state.profile, state.user, setUser],
  );

  // The gate owns the user, so it owns keeping their scan token alive — one
  // timer, however many things are showing the pass.
  const secondsToRefresh = useScanTokenRefresh(state.user, setUser);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    /** Finds (or creates) the Strapi record behind the validated profile. */
    const loadMember = (profile) => {
      resolveClubpassUser(profile.username).then(
        (user) => {
          if (!cancelled) setState({ status: "ready", profile, user });
        },
        (error) => {
          console.error("ClubPass user lookup failed", error);
          if (!cancelled) setState({ status: "ready", profile, user: null });
        },
      );
    };

    if (ssoToken) {
      validateOnce(ssoToken).then(
        (profile) => {
          // Spent — don't leave it in the address bar, history or referrer headers.
          stripSsoFromUrl();
          if (!cancelled) loadMember(profile);
        },
        (error) => {
          console.error("ClubPass SSO validation failed", error);

          // Same clean-up on the way out: a dead token has no business staying
          // in the URL, and neither has a stale cookie.
          stripSsoFromUrl();
          clearSsoSession();

          if (!cancelled) {
            setState({
              status: "failed",
              message: SSO_MESSAGES[error?.code] ?? SSO_FALLBACK_MESSAGE,
            });
          }
        },
      );
    } else {
      // No token: either the cookie from an earlier arrival still holds, or
      // they never came through the app at all.
      const profile = readSsoSession();

      if (profile?.username) loadMember(profile);
      else setState({ status: "register" });
    }

    return () => {
      cancelled = true;
    };
  }, [ssoToken]);

  if (state.status === "register") return <Register />;
  if (state.status === "failed") return <SsoFailed message={state.message} />;
  if (state.status === "loading") return <Loader />;

  return (
    <ClubpassUserContext.Provider value={value}>
      <ScanCountdownContext.Provider value={secondsToRefresh}>
        {children}
      </ScanCountdownContext.Provider>
    </ClubpassUserContext.Provider>
  );
}
