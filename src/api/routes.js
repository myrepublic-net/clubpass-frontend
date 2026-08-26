/**
 * Route voting.
 *
 * Routes other than the East are launched once enough members ask for them, so
 * the tally lives in Strapi rather than in the page. A member gets one vote
 * across all routes — the vote both increments the route's count and marks
 * which route they spent it on.
 */

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";
const TOKEN = import.meta.env.VITE_STRAPI_TOKEN;

/** Route name → the boolean column on clubpass-user that records the vote. */
export const VOTE_COLUMNS = {
  North: "north",
  South: "south",
  West: "west",
};

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Routes request failed (${res.status})`);
  }

  return body;
}

/**
 * Every votable route with its tally. `voted` and `required` are null on routes
 * that haven't had targets set yet, so both are normalised here — the pages
 * showing them shouldn't each have to guard against nulls.
 */
export async function fetchRoutes() {
  const body = await request("/routes");

  return (body?.data ?? []).map((route) => {
    const voted = Number(route.voted) || 0;
    const required = Number(route.required) || 0;

    return {
      id: route.documentId,
      name: route.name,
      voted,
      required,
      // What the member actually reads: how many more are needed.
      remaining: Math.max(required - voted, 0),
      progress: required > 0 ? Math.min(Math.round((voted / required) * 100), 100) : 0,
      // A route with no target set isn't open for votes yet.
      open: required > 0,
    };
  });
}

/** Which route this member has already voted for, or "" if they haven't. */
export function votedRouteOf(user) {
  const name = Object.keys(VOTE_COLUMNS).find((route) => user?.[VOTE_COLUMNS[route]]);
  return name ?? "";
}

/**
 * Spends the member's one vote.
 *
 * Two writes: the tally on the route, then the flag on the member. The member
 * flag goes last on purpose — if the second write fails the member can vote
 * again, which is better than a member who is marked as having voted for a
 * route whose count never moved.
 *
 * The count is read-modify-write, so two members voting in the same instant can
 * cost one vote. At the scale this operates on that's a fair trade for not
 * needing a server-side counter.
 */
export async function castVote({ route, user }) {
  const column = VOTE_COLUMNS[route.name];

  if (!column) throw new Error(`${route.name} isn't a votable route.`);
  if (votedRouteOf(user)) throw new Error("You've already voted for a route.");
  if (!user?.documentId) throw new Error("We couldn't find your membership record.");

  await request(`/routes/${route.id}?status=published`, {
    method: "PUT",
    body: JSON.stringify({ data: { voted: route.voted + 1 } }),
  });

  await request(`/clubpass-users/${user.documentId}?status=published`, {
    method: "PUT",
    body: JSON.stringify({ data: { [column]: true } }),
  });

  return { ...route, voted: route.voted + 1, remaining: Math.max(route.remaining - 1, 0) };
}
