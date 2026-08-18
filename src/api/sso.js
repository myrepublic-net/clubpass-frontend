/**
 * RewardLand SSO.
 *
 * The RewardLand app opens /clubpass-app?rr_sso=<token>. That token is not a
 * profile — it has to be exchanged for one. The exchange needs a partner
 * X-API-Key that must never reach the browser, so we don't call RewardLand
 * directly: we POST the token to our own Lambda, which holds the key and calls
 * RewardLand's POST /api/sso/validate on our behalf.
 *
 * Nothing here is persisted: the token is spent once on arrival and the profile
 * it returns lives in React state for as long as the page is open.
 */

/**
 * The Lambda endpoint itself — set VITE_SSO_API_BASE_URL per environment. The
 * body is posted straight to it; there's no path on top.
 */
const SSO_API_URL = (import.meta.env.VITE_SSO_API_BASE_URL ?? "").replace(/\/+$/, "");

/** The query parameter the app appends. Case-sensitive, per the integration guide. */
export const SSO_PARAM = "rr_sso";

/**
 * Exchanges rr_sso for the RewardLand profile.
 *
 * Resolves to { rrId, username, email, phoneNumber } on success. Throws with
 * the RewardLand error code attached (`error.code`) otherwise, so the caller
 * can tell an expired link from a deactivated account.
 */
export async function validateSsoToken(rrSso) {
  if (!SSO_API_URL) throw new Error("VITE_SSO_API_BASE_URL is not configured");

  const res = await fetch(SSO_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [SSO_PARAM]: rrSso }),
  });

  const body = await res.json().catch(() => null);

  // { code, errorMessage, data } — the envelope RewardLand returns, passed
  // through by the Lambda.
  if (!res.ok || body?.code !== "SUCCESS" || !body?.data?.username) {
    const error = new Error(body?.errorMessage ?? `SSO validation failed (${res.status})`);
    error.code = body?.code ?? "INTERNAL_ERROR";
    throw error;
  }

  return body.data;
}

/**
 * Takes rr_sso out of the address bar once the Lambda has answered, so the
 * token isn't left in history, bookmarks or referrer headers. replaceState
 * rather than a redirect — the page is already rendering.
 */
export function stripSsoFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(SSO_PARAM)) return;

  url.searchParams.delete(SSO_PARAM);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
