/**
 * Where the driver is standing tonight — the route they're running and the
 * pick-up point they're at.
 *
 * Chosen once after sign-in and remembered briefly, so a driver working a queue
 * of members isn't re-picking their own stop between every scan. It's on the
 * scan record afterwards, which is what makes a night's boardings countable per
 * stop.
 */

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";
const TOKEN = import.meta.env.VITE_STRAPI_TOKEN;

export const ROUTES = ["East", "West", "North", "South"];

/**
 * Ten minutes, as a cookie rather than localStorage: a stop is a short-lived
 * fact about where the coach is, and it expiring on its own is the point. A
 * driver who moves to the next stop and forgets to change it is a worse outcome
 * than one who re-picks it.
 */
const COOKIE_NAME = "clubpass_driver_stop";
const TTL_SECONDS = 10 * 60;

export function readStop() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return null;

  try {
    const stop = JSON.parse(decodeURIComponent(match[1]));
    return stop?.route ? stop : null;
  } catch {
    return null;
  }
}

export function saveStop({ route, pickupPoint }) {
  const value = encodeURIComponent(JSON.stringify({ route, pickupPoint }));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${COOKIE_NAME}=${value}; path=/; Max-Age=${TTL_SECONDS}; SameSite=Lax${secure}`;
}

export function clearStop() {
  document.cookie = `${COOKIE_NAME}=; path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * The pick-up points on a route, in the order Strapi returns them.
 *
 * An empty list is a normal answer, not an error — a route with no stops set up
 * yet is something the driver is told about rather than something that breaks.
 */
export async function fetchPickupPoints(route) {
  const query = new URLSearchParams({ "filters[route][$eq]": route });

  const res = await fetch(`${BASE_URL}/api/pickup-points?${query}`, {
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Couldn't load pick-up points (${res.status})`);
  }

  return (body?.data ?? []).map((point) => ({
    id: point.documentId ?? String(point.id),
    name: point.name,
  }));
}
