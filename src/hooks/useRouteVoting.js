import { useCallback, useEffect, useState } from "react";

import { castVote, fetchRoutes, votedRouteOf } from "../api/routes.js";

/**
 * Route voting, shared by the public page and the in-app page.
 *
 * The two pages look nothing alike and keep their own markup — what they share
 * is the tally, the one-vote-per-member rule and the writes. `user` is null on
 * the public page, where a tap sends people to the app instead of voting.
 */
export default function useRouteVoting({ user, setUser } = {}) {
  const [routes, setRoutes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchRoutes().then(
      (found) => {
        if (cancelled) return;
        setRoutes(found);
        setStatus("ready");
      },
      (loadError) => {
        console.error("Route voting failed to load", loadError);
        if (!cancelled) setStatus("error");
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  /** The route this member already spent their vote on, if any. */
  const votedRoute = votedRouteOf(user);

  // The route whose vote is in flight — the page shows a loader on it and
  // locks the other buttons until the API answers.
  const [pendingRoute, setPendingRoute] = useState(null);

  const vote = useCallback(
    async (route) => {
      if (votedRoute || pendingRoute) return;

      setError("");
      setPendingRoute(route.id);

      try {
        // Nothing changes on screen until the vote is actually recorded: the
        // count and the "voted" state come from the API's answer.
        const updated = await castVote({ route, user });

        setRoutes((current) =>
          current.map((item) =>
            item.id === route.id
              ? { ...item, voted: updated.voted, remaining: updated.remaining }
              : item,
          ),
        );
        setUser?.({ ...user, voted_route: { documentId: route.id, route_name: route.name } });
      } catch (voteError) {
        console.error("Vote failed", voteError);
        setError(voteError?.message || "Your vote didn't go through. Please try again.");
      } finally {
        setPendingRoute(null);
      }
    },
    [user, setUser, votedRoute, pendingRoute],
  );

  return { routes, status, votedRoute, pendingRoute, vote, error };
}
