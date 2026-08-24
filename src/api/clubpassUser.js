import { driverToken, signOutDriver } from "./driverAuth.js";

/** The exact message the Strapi verify route's policy replies with. */
const DRIVER_REQUIRED = "Driver sign-in required";

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";
const TOKEN = import.meta.env.VITE_STRAPI_TOKEN;

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
    throw new Error(body?.error?.message ?? `Strapi request failed (${res.status})`);
  }

  return body;
}

/**
 * Draft & publish is on for clubpass-user. In Strapi 5 every document has a
 * draft version whether or not it is published, so looking up with
 * status=draft finds users that were created but never published — otherwise
 * we would create a duplicate for them on every visit.
 */
export async function findUserByUserName(userName) {
  const query = new URLSearchParams({
    "filters[userName][$eq]": userName,
  });

  const body = await request(`/clubpass-users?${query}`);
  return body?.data?.[0] ?? null;
}

export async function createUser(userName) {
  const body = await request("/clubpass-users?status=published", {
    method: "POST",
    body: JSON.stringify({ data: { userName } }),
  });

  return body?.data ?? null;
}

/** A user is subscribed once a payment has written their boarding code. */
export function isPaid(user) {
  return Boolean(user?.secretCode && user?.paidOn);
}

/** Six-digit boarding code, zero-padded so it's always six characters. */
function generateSecretCode() {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return String(n % 1_000_000).padStart(6, "0");
}

/** Writes the membership onto the user record after PayPal approves. */
export async function markUserPaid({ documentId, userName, email, transactionId }) {
  const body = await request(`/clubpass-users/${documentId}?status=published`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        // Don't blank out an existing email if PayPal didn't give us one.
        ...(email && { email }),
        tripLeft: 4,
        paidOn: new Date().toISOString(),
        secretCode: generateSecretCode(),
        transactionId,
      },
    }),
  });

  // Only the read endpoints mint a scan token, so read the record back — the
  // PUT response alone can't be rendered as a boarding QR.
  return (userName && (await findUserByUserName(userName))) ?? body?.data ?? null;
}

/* ==========================================================================
   Boarding scans
   ========================================================================== */

/** Where the scanned link points. Defaults to wherever the pass itself is served. */
const SCAN_BASE_URL = import.meta.env.VITE_SCAN_BASE_URL ?? "";

/**
 * What the boarding QR encodes: a link the driver's camera can open on its own,
 * carrying the 60-second token rather than the boarding code. An old screenshot
 * opens a dead link instead of handing over a code that works forever.
 */
export function buildScanLink(user) {
  if (!user?.userName || !user?.token) return "";

  const base = SCAN_BASE_URL || (typeof window === "undefined" ? "" : window.location.origin);
  const query = new URLSearchParams({ userName: user.userName, token: user.token });

  return `${base}/scan?${query}`;
}

/**
 * The token is a JWT, so the page the driver lands on can show who it belongs to
 * and how long it has left without a round trip. Reading it proves nothing —
 * Strapi still validates the signature when the trip is spent.
 */
export function readScanToken(token) {
  try {
    const payload = String(token).split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      Math.ceil(payload.length / 4) * 4,
      "=",
    );
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/**
 * Spends one trip. Rejects when the token is expired, reused or already spent.
 *
 * The only call here that doesn't use the site's API token: a scan is a write
 * against someone's membership, so it goes out as the signed-in driver and
 * Strapi decides whether that driver is allowed to make it.
 */
export async function verifyScan({ userName, token, pickupPoint, route }) {
  const jwt = driverToken();

  if (!jwt) {
    throw Object.assign(new Error("Sign in as a driver to scan boarding passes."), {
      code: "NO_DRIVER",
    });
  }

  const res = await fetch(`${BASE_URL}/api/clubpass-users/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    // The stop is recorded on the scan; Strapi stores null when it's absent.
    body: JSON.stringify({ userName, token, pickupPoint, route }),
  });

  const body = await res.json().catch(() => null);

  // An expired *scan* token is also a 401, so the two can't be told apart by
  // status. These two messages are the only ones about the driver's own
  // sign-in: one from our route policy, one from Strapi's JWT check.
  const message = body?.error?.message ?? "";
  const signInRejected =
    message === DRIVER_REQUIRED || message.toLowerCase().includes("credentials");

  if (signInRejected) {
    // A shift that has run past its JWT — drop it, so the driver is asked to
    // sign in again rather than tapping a button that silently does nothing.
    signOutDriver();
    throw Object.assign(new Error("Your driver sign-in has expired. Please sign in again."), {
      code: "NO_DRIVER",
    });
  }

  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Scan failed (${res.status})`);
  }

  return body?.data ?? null;
}

// Keyed by userName so a StrictMode double-effect, a remount or a re-render
// can't fire two creates for the same person.
const inFlight = new Map();

/** Find the user for `userName`, creating them in Strapi if they don't exist. */
export function resolveClubpassUser(userName) {
  let pending = inFlight.get(userName);

  if (!pending) {
    pending = (async () => {
      const existing = await findUserByUserName(userName);
      return existing ?? (await createUser(userName));
    })();

    // A network blip shouldn't poison retries — only successes stay cached.
    pending.catch(() => inFlight.delete(userName));
    inFlight.set(userName, pending);
  }

  return pending;
}
