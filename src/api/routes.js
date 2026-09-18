import { readMemberSession } from "./auth.js";
import { castRouteVote } from "./subscribe.js";

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
// Read-only — the vote itself is written by the Lambda.
const TOKEN = import.meta.env.VITE_STRAPI_TOKEN_GET;

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

// Drop points and the vote-box image are relations, so they're named; voters
// are deliberately never populated — that list is for the Strapi admin only.
const QUERY =
  "populate[drop_points][populate]=*" +
  "&populate[voting_box_image]=true" +
  "&sort=id:asc";

/** Largest generated size of an upload, falling back to the original. */
function mediaUrl(item) {
  return item?.formats?.large?.url ?? item?.formats?.medium?.url ?? item?.url ?? null;
}

/**
 * Every route with its tally and its content. `voted` and `vote_required` can be
 * null on a route that hasn't had a target set, so both are normalised here —
 * the pages showing them shouldn't each have to guard against nulls.
 */
export async function fetchRoutes() {
  const body = await request(`/routes?${QUERY}`);

  return (body?.data ?? []).map((route) => {
    const voted = Number(route.voted) || 0;
    const required = Number(route.vote_required) || 0;
    const title = route.title ?? "";

    return {
      id: route.documentId,
      name: route.route_name ?? "",
      title,
      // "NORTH EASTIES" -> "north-easties": the stylesheet's per-route class.
      slug: title.trim().toLowerCase().replace(/\s+/g, "-"),
      subTitle: route.sub_title ?? "",
      dropoffHeading: route.dropoff_heading ?? "",
      dropPoints: (route.drop_points ?? []).map((point) => ({
        id: point.documentId,
        name: point.point_name ?? "",
      })),
      voted,
      required,
      // What the member actually reads: how many more are needed.
      remaining: Math.max(required - voted, 0),
      progress: required > 0 ? Math.min(Math.round((voted / required) * 100), 100) : 0,
      // A route with no target set isn't open for votes yet.
      open: required > 0,
      votingTitle: route.voting_title ?? "",
      votingButtonText: route.voting_button_text ?? "",
      votingImage: mediaUrl(route.voting_box_image),
      moreInfo: route.more_info ?? "",
      mapLinkText: route.map_link_text ?? "",
      mapLink: route.map_link || null,
    };
  });
}

/** The documentId of the route this member voted for, or "" if they haven't. */
export function votedRouteOf(user) {
  return user?.voted_route?.documentId ?? "";
}

/**
 * Spends the member's one vote. The Lambda sets the member's `voted_route` and
 * adds one to the route's count; this returns the route with the new count.
 */
export async function castVote({ route, user }) {
  if (votedRouteOf(user)) throw new Error("You've already voted for a route.");
  if (!user?.userName) throw new Error("We couldn't find your account.");

  const { voted } = await castRouteVote({
    userName: user.userName,
    routeId: route.id,
    accessToken: readMemberSession()?.token,
  });

  return { ...route, voted, remaining: Math.max(route.required - voted, 0) };
}
