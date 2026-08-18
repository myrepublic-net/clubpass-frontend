/**
 * ClubPass subscribe API — the Lambda that owns everything PayPal.
 *
 * Web SDK v6 is server-authenticated: the browser never creates an order or a
 * subscription itself, it only approves one the server already made. So every
 * call here is a POST to the single Lambda URL with an `action` in the body,
 * the same shape the SSO Lambda uses.
 *
 * The PayPal client secret, the plan id and the vault tokens all live in that
 * Lambda. Nothing secret is in this bundle.
 */

const API_URL = (import.meta.env.VITE_SUBSCRIBE_API_URL ?? "").replace(/\/+$/, "");

async function call(action, payload = {}) {
  if (!API_URL) throw new Error("Checkout isn't configured — VITE_SUBSCRIBE_API_URL is missing.");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.error) {
    const error = new Error(body?.error ?? `Checkout request failed (${res.status})`);
    error.action = action;
    throw error;
  }

  return body;
}

/**
 * A browser-safe token minted from the client id + secret server-side. v6 needs
 * one for card fields and the wallets — a bare client id only covers the
 * PayPal button.
 */
export async function fetchClientToken() {
  const { clientToken } = await call("client-token");
  return clientToken;
}

/**
 * PayPal wallet route: a real PayPal subscription against the billing plan, so
 * PayPal itself does the monthly renewal.
 */
export function createSubscription({ userName, email }) {
  return call("create-subscription", { userName, email });
}

/** Reads the approved subscription back so we save a confirmed one, not a pending one. */
export function activateSubscription({ subscriptionId, userName }) {
  return call("activate-subscription", { subscriptionId, userName });
}

/**
 * Card / Google Pay / Apple Pay route. Wallets can't fund a PayPal subscription,
 * so this is a one-month order that *vaults* the payment method — the Lambda's
 * renewal job charges the saved method every month from then on.
 */
export function createOrder({ method, userName, email }) {
  return call("create-order", { method, userName, email });
}

/** Captures the approved order and stores the vault token against the member. */
export function captureOrder({ orderId, method, userName }) {
  return call("capture-order", { orderId, method, userName });
}
