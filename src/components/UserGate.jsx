import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { resolveClubpassUser } from "../api/clubpassUser.js";
import useScanTokenRefresh from "../hooks/useScanTokenRefresh.js";
import { ClubpassUserContext, ScanCountdownContext } from "./clubpassUserContext.js";
import "../css/user-gate.css";

const APP_LINK = "https://rewardland.onelink.me/EwIe/start";

/** Query keys are case-sensitive, so accept ?userName=, ?username=, ?user_name= alike. */
function readUserName(searchParams) {
  for (const [key, value] of searchParams) {
    if (key === "userName") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
}

function Loader() {
  return (
    <div className="cpg-gate">
      <div className="cpg-spinner" role="status" aria-label="Loading your ClubPass" />
      <p className="cpg-loading-text">Loading your ClubPass…</p>
    </div>
  );
}

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

/**
 * Gates the ClubPass page on the ?userName= query string. A missing userName is
 * the only thing that blocks the page — it shows the register screen instead.
 * With a userName we show the loader while looking the user up in Strapi
 * (creating them if they're new), then the page either way: a failed lookup
 * leaves the user null rather than keeping someone out of the page.
 */
export default function UserGate({ children }) {
  const [searchParams] = useSearchParams();
  const userName = readUserName(searchParams);

  const [state, setState] = useState({ status: userName ? "loading" : "register" });

  const setUser = useCallback((user) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const value = useMemo(
    () => ({ userName, user: state.user ?? null, setUser }),
    [userName, state.user, setUser],
  );

  // The gate owns the user, so it owns keeping their scan token alive — one
  // timer, however many things are showing the pass.
  const secondsToRefresh = useScanTokenRefresh(state.user, setUser);

  useEffect(() => {
    if (!userName) {
      setState({ status: "register" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    resolveClubpassUser(userName).then(
      (user) => {
        if (!cancelled) setState({ status: "ready", user });
      },
      (error) => {
        console.error("ClubPass user lookup failed", error);
        if (!cancelled) setState({ status: "ready", user: null });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [userName]);

  if (state.status === "register") return <Register />;
  if (state.status === "loading") return <Loader />;

  return (
    <ClubpassUserContext.Provider value={value}>
      <ScanCountdownContext.Provider value={secondsToRefresh}>
        {children}
      </ScanCountdownContext.Provider>
    </ClubpassUserContext.Provider>
  );
}
