import { readMemberSession } from "./auth.js";
import { driverToken, signOutDriver } from "./driverAuth.js";
import { ensureMember } from "./subscribe.js";

/** The exact message the Strapi verify route's policy replies with. */
const DRIVER_REQUIRED = "Driver sign-in required";

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";
// Read-only. Every write to a member record goes through the clubpass-subscribe
// Lambda, so nothing in this bundle can create members or mark one paid.
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
/** The route a member voted for — a relation, so it has to be asked for. */
const VOTED_ROUTE = { "populate[voted_route][fields][0]": "route_name" };

export async function findUserByUserName(userName) {
  const query = new URLSearchParams({
    "filters[userName][$eq]": userName,
    ...VOTED_ROUTE,
  });

  const body = await request(`/clubpass-users?${query}`);
  return body?.data?.[0] ?? null;
}

/** Same draft-inclusive lookup as findUserByUserName, keyed by email instead. */
export async function findUserByEmail(email) {
  const query = new URLSearchParams({
    "filters[email][$eq]": email,
    ...VOTED_ROUTE,
  });

  const body = await request(`/clubpass-users?${query}`);
  return body?.data?.[0] ?? null;
}

/** One month on from `from`, clamped so the 31st doesn't skip February. */
function monthAfter(from) {
  const next = new Date(from);
  const day = next.getDate();
  next.setMonth(next.getMonth() + 1);
  if (next.getDate() < day) next.setDate(0);
  return next;
}

/** A renewal a few days late (PayPal and our own job both retry) doesn't cut access. */
const GRACE_MS = 3 * 86_400_000;

/**
 * Whether this member has access right now. Must match hasAccess() in
 * clubpass-subscribe/lib/membership.mjs, which applies it server-side.
 *
 *   never paid (no paidOn)  → not paid
 *   no billingStatus (records from before billing was tracked) → paid, as before
 *   active / paypal-managed → until nextBillingOn + grace (no date: paid)
 *   manual-renewal          → one month from paidOn, + grace
 *   cancelled               → until the paid period ends (accessEndsOn)
 *   lapsed / suspended      → not paid
 *
 * paidOn rather than secretCode: the API blanks secretCode once trips run out,
 * and a member with no rides left this month is still a member.
 */
export function isPaid(user, now = Date.now()) {
  if (!user?.paidOn) return false;

  const at = (value) => (value ? new Date(value).getTime() : NaN);
  const until = (ms) => !Number.isNaN(ms) && ms > now;
  // An unparseable paidOn gives no month to measure (NaN), rather than throwing.
  const monthAfterPaid = monthAfter(user.paidOn).getTime();

  switch (user.billingStatus ?? "") {
    case "":
      return true;
    case "active":
    case "paypal-managed":
      return !user.nextBillingOn || until(at(user.nextBillingOn) + GRACE_MS);
    case "manual-renewal":
      return until((user.nextBillingOn ? at(user.nextBillingOn) : monthAfterPaid) + GRACE_MS);
    case "cancelled":
      return until(user.accessEndsOn ? at(user.accessEndsOn) : monthAfterPaid);
    default:
      return false;
  }
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

/**
 * Find the user for `identity`, creating them in Strapi if they don't exist.
 *
 * `identity` is either a bare userName (SubscribeModal's retry path, which
 * has no email on hand) or `{ username, email }` from a fresh login API
 * response — the login API is the source of truth for a member's profile, so
 * an existing record's email is kept in sync with it here.
 */
export function resolveClubpassUser(identity) {
  const { username: userName, email } =
    typeof identity === "string" ? { username: identity, email: undefined } : identity;

  let pending = inFlight.get(userName);

  if (!pending) {
    pending = (async () => {
      // The common case — an existing member with an up-to-date email — stays
      // a single read from the browser.
      const existing = await findUserByUserName(userName);
      if (existing && (!email || existing.email === email)) return existing;

      // Creating the record or syncing its email is a write, so the Lambda
      // does it, against the member's own login session.
      const { user } = await ensureMember({
        userName,
        email,
        accessToken: readMemberSession()?.token,
      });
      return user ?? existing;
    })();

    // A network blip shouldn't poison retries — only successes stay cached.
    pending.catch(() => inFlight.delete(userName));
    inFlight.set(userName, pending);
  }

  return pending;
}
