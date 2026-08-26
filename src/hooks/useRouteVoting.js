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

  const vote = useCallback(
    async (route) => {
      if (votedRoute) return;

      // Optimistic: the count moves as the member taps, and rolls back below if
      // Strapi refuses. A vote that looks ignored for a second reads as broken.
      setRoutes((current) =>
        current.map((item) =>
          item.id === route.id
            ? { ...item, voted: item.voted + 1, remaining: Math.max(item.remaining - 1, 0) }
            : item,
        ),
      );

      setUser?.({ ...user, [route.name.toLowerCase()]: true });
      setError("");

      try {
        await castVote({ route, user });
      } catch (voteError) {
        console.error("Vote failed", voteError);

        setRoutes((current) =>
          current.map((item) =>
            item.id === route.id
              ? { ...item, voted: route.voted, remaining: route.remaining }
              : item,
          ),
        );
        setUser?.(user);
        setError(voteError.message);
      }
    },
    [user, setUser, votedRoute],
  );

  return { routes, status, votedRoute, vote, error };
}
