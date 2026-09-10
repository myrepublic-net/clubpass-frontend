import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { readMemberSession } from "../api/auth.js";
import { resolveClubpassUser } from "../api/clubpassUser.js";
import useScanTokenRefresh from "../hooks/useScanTokenRefresh.js";
import { ClubpassUserContext, ScanCountdownContext } from "./clubpassUserContext.js";
import "../css/user-gate.css";

/**
 * Opens /clubpass-app as a member of your choosing, with no login required.
 *
 * For working on the page itself without going through the login form each
 * time. It bypasses the only thing standing between the public and someone
 * else's pass, so it must be false in anything you deploy — see the note in
 * .env.
 */
const SKIP_LOGIN = import.meta.env.VITE_SKIP_LOGIN === "true";

/** Who to be while skipping. ?userName= overrides it, so you can switch members. */
const SKIP_LOGIN_USERNAME = import.meta.env.VITE_SKIP_LOGIN_USERNAME ?? "devtester";

function Loader() {
  return (
    <div className="cpg-gate">
      <div className="cpg-gate-overlay"></div>
      <div className="cpg-spinner" role="status" aria-label="Loading your Clubpass" />
      <p className="cpg-loading-text">Loading your Clubpass…</p>
    </div>
  );
}

/** No stored session — the member hasn't logged in on this device/browser. */
function SignInPrompt() {
  return (
    <div className="cpg-gate">
      <div className="cpg-gate-overlay"></div>
      <div className="cpg-card">
        <img className="cp-logo" src="/images/cp-rw-logo.png" />
        <h1>Log in to Clubpass</h1>
        <p>Sign in to your Clubpass account to see your pass, trips, and rewards.</p>
        <a className="cpg-cta" href="/login">
          Log In
        </a>
        <p className="cpg-fine">
          New here? <a href="/signup">Create an account</a>
        </p>
      </div>
    </div>
  );
}

/**
 * Gates the ClubPass page on a member being logged in. The login form
 * (src/api/auth.js) is the only way in now — a successful login stores a
 * session in localStorage, and this gate reads it back rather than exchanging
 * an rr_sso token on every visit.
 *
 * Once we know who the member is, we show the loader while looking them up in
 * Strapi (creating them, or syncing their email, if needed), then the page
 * either way: a failed lookup leaves the user null rather than keeping
 * someone out of the page.
 */
export default function UserGate({ children }) {
  const [searchParams] = useSearchParams();

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

    /** Finds (or creates, or email-syncs) the Strapi record behind the member. */
    const loadMember = (profile) => {
      resolveClubpassUser(profile).then(
        (user) => {
          if (!cancelled) setState({ status: "ready", profile, user });
        },
        (error) => {
          console.error("ClubPass user lookup failed", error);
          if (!cancelled) setState({ status: "ready", profile, user: null });
        },
      );
    };

    if (SKIP_LOGIN) {
      const userName = searchParams.get("userName")?.trim() || SKIP_LOGIN_USERNAME;

      console.warn(
        `[clubpass] VITE_SKIP_LOGIN is on — signed in as "${userName}" with no real login. ` +
          "This must never be on in a deployed build.",
      );

      loadMember({ username: userName, email: "" });
      return () => {
        cancelled = true;
      };
    }

    const session = readMemberSession();

    if (session?.user?.username) {
      loadMember(session.user);
    } else {
      // No stored session means we have no idea who this is — the login page
      // is the only door.
      setState({ status: "signin" });
    }

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (state.status === "signin") return <SignInPrompt />;
  if (state.status === "loading") return <Loader />;

  return (
    <ClubpassUserContext.Provider value={value}>
      <ScanCountdownContext.Provider value={secondsToRefresh}>
        {children}
      </ScanCountdownContext.Provider>
    </ClubpassUserContext.Provider>
  );
}
