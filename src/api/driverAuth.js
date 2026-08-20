/**
 * Driver sign-in.
 *
 * Boarding scans spend a member's trip, so they can't be something any visitor
 * can do. A driver signs in as a Strapi user and every verify call carries that
 * user's JWT — Strapi checks it and rejects anything else.
 *
 * Kept apart from the member side on purpose: a driver is not a ClubPass member
 * and shares none of that flow.
 */

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";

/**
 * localStorage, not session: a driver signs in at the start of a shift and
 * works through the night, and the browser reopening between scans shouldn't
 * put them back at the login screen.
 */
const STORAGE_KEY = "clubpass:driver";

export function readDriverSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeDriverSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Private mode — the driver stays signed in for this page only.
  }
}

export function signOutDriver() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** The JWT to send with a scan, or "" when nobody is signed in. */
export function driverToken() {
  return readDriverSession()?.jwt ?? "";
}

/**
 * POST /api/auth/local. `identifier` is the username or the email — Strapi
 * accepts either.
 */
export async function signInDriver({ identifier, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.jwt) {
    throw new Error(
      body?.error?.message === "Invalid identifier or password"
        ? "That username or password isn't right."
        : (body?.error?.message ?? `Sign-in failed (${res.status})`),
    );
  }

  const session = {
    jwt: body.jwt,
    // Enough to greet them and show who is signed in; nothing sensitive.
    username: body.user?.username ?? identifier,
    email: body.user?.email ?? "",
  };

  storeDriverSession(session);

  return session;
}
