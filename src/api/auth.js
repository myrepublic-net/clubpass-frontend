/**
 * ClubPass self-serve auth — signup, login, and email/phone OTP.
 *
 * Backend: the Reward Land Channel Account API, proxied through
 * reward-land-channel-account-lambda-logging. Unlike the SSO/subscribe
 * Lambdas, actions aren't a body field on one URL — each is its own path
 * segment: POST {API_URL}/{action}. Identity fields (username, email,
 * password, otp, phoneNumber, phoneCountryCode) go up as plaintext; the
 * Lambda RSA-encrypts them before forwarding to Reward Land, so no key ever
 * reaches the browser.
 *
 * The registration journey is stateful: `register` mints a token that must
 * be sent back as X-REGISTRATION-TOKEN on every later step. One signup
 * wizard is ever in flight per tab, so that token lives in module state
 * rather than something heavier like context.
 *
 * Until VITE_AUTH_API_URL is set, every call here is simulated locally: OTPs
 * are generated in-memory, "sent" to the console, and verified against what
 * was generated — so the multi-step form works fully offline while the real
 * credential/domain/scope grant is being finalised with Reward Land.
 */

const API_URL = (import.meta.env.VITE_AUTH_API_URL ?? "").replace(/\/+$/, "");
const SIMULATE = !API_URL;

// Reward Land's Singapore-only phone fields are split (phoneCountryCode +
// phoneNumber); the UI only ever collects a local SG number, so the code is
// fixed rather than parsed out of the combined string.
const COUNTRY_CODE_DIGITS = "65";

let registrationToken = null;

/**
 * The member's own sign-in — the only way into /clubpass-app now that rr_sso
 * is gone. localStorage, not session: closing the tab shouldn't sign someone
 * out of a pass they'll want again tomorrow. Same pattern as driverAuth.js's
 * session, kept separate because a member and a driver are different people.
 */
const SESSION_STORAGE_KEY = "clubpass:member";

export function readMemberSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeMemberSession(session) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Private mode — the member stays signed in for this page only.
  }
}

export function signOutMember() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * Ends the Reward Land session with the web-issued refresh token, per the
 * channel API's session-handling note, then clears the local one regardless
 * of whether that call succeeds — a logout that failed server-side shouldn't
 * leave the member stuck looking signed in on this device.
 */
export async function logout() {
  const session = readMemberSession();

  try {
    if (!SIMULATE && session?.refreshToken) {
      await request("logout", { refreshToken: session.refreshToken });
    }
  } catch (error) {
    console.error("ClubPass logout failed", error);
  } finally {
    signOutMember();
  }
}

async function request(action, payload, extraHeaders = {}) {
  const res = await fetch(`${API_URL}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  // { code, errorMessage, data } — the envelope Reward Land returns, passed
  // through by the Lambda (same shape sso.js already relies on).
  if (!res.ok || body?.code !== "SUCCESS") {
    const error = new Error(body?.errorMessage ?? `Request failed (${res.status})`);
    error.code = body?.code ?? "INTERNAL_ERROR";
    throw error;
  }

  return body.data ?? {};
}

function tokenHeaders() {
  if (!registrationToken) {
    throw Object.assign(new Error("Your session expired — please start again."), {
      code: "NO_REGISTRATION_TOKEN",
    });
  }
  return { "X-REGISTRATION-TOKEN": registrationToken };
}

function stripCountryCode(phoneNumberWithCode) {
  return phoneNumberWithCode.replace(/^\+?65/, "");
}

/* ---- simulation ---------------------------------------------------------- */

// identifier (email or phone) -> last OTP issued for it, so verify can check
// against something real instead of accepting anything.
const pendingOtps = new Map();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function simulateSendOtp(identifier) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  pendingOtps.set(identifier, code);
  console.warn(`[auth:simulate] OTP for ${identifier} is ${code} (VITE_AUTH_API_URL not set)`);
  return delay(500).then(() => ({ expiresIn: 120 }));
}

function simulateVerifyOtp(identifier, otp) {
  return delay(400).then(() => {
    const expected = pendingOtps.get(identifier);
    if (!expected || otp !== expected) {
      const error = new Error("That code didn't match. Please try again.");
      error.code = "INVALID_OTP";
      throw error;
    }
    pendingOtps.delete(identifier);
    return { verified: true };
  });
}

/* ---- email OTP ------------------------------------------------------------ */

/**
 * First call of the journey. Starts registration (minting the token every
 * later step needs) before requesting the email OTP; a resend just re-asks
 * against the same token.
 */
export async function requestEmailOtp({ username, email }) {
  if (SIMULATE) return simulateSendOtp(email);

  if (!registrationToken) {
    const data = await request("register", { username, email });
    registrationToken = data.registrationToken;
  }

  return request("request-otp", { email }, tokenHeaders());
}

export async function verifyEmailOtp({ email }, otp) {
  if (SIMULATE) return simulateVerifyOtp(email, otp);
  return request("verify-otp", { email, otp }, tokenHeaders());
}

/* ---- phone OTP ------------------------------------------------------------ */

export async function requestPhoneOtp(phoneNumberWithCode) {
  if (SIMULATE) return simulateSendOtp(phoneNumberWithCode);

  return request(
    "request-phone-otp",
    { phoneCountryCode: COUNTRY_CODE_DIGITS, phoneNumber: stripCountryCode(phoneNumberWithCode) },
    tokenHeaders(),
  );
}

export async function verifyPhoneOtp(phoneNumberWithCode, otp) {
  if (SIMULATE) return simulateVerifyOtp(phoneNumberWithCode, otp);

  return request(
    "verify-phone-otp",
    { phoneCountryCode: COUNTRY_CODE_DIGITS, phoneNumber: stripCountryCode(phoneNumberWithCode), otp },
    tokenHeaders(),
  );
}

/* ---- account ---------------------------------------------------------------- */

export async function signup({ email, phoneNumber, password, referralCode, promoCode, marketingOptIn }) {
  if (SIMULATE) {
    return delay(700).then(() => {
      console.warn("[auth:simulate] signup", { email, phoneNumber, referralCode, promoCode, marketingOptIn });
      return { user: { email, phoneNumber } };
    });
  }

  const data = await request(
    "register-complete",
    {
      email,
      password,
      phoneCountryCode: COUNTRY_CODE_DIGITS,
      phoneNumber: stripCountryCode(phoneNumber),
      referralCode,
      promoCode,
      allowEmailMarketing: marketingOptIn,
    },
    tokenHeaders(),
  );

  // The journey is done — a second signup in the same tab should start clean.
  registrationToken = null;
  return data;
}

export async function login({ identifier, password }) {
  if (SIMULATE) {
    const data = await delay(700).then(() => {
      console.warn("[auth:simulate] login", { identifier });
      const isEmail = identifier.includes("@");
      // Never store the raw email as the username — Strapi's userName is a
      // separate, required field distinct from email.
      return {
        user: { username: isEmail ? identifier.split("@")[0] : identifier, email: isEmail ? identifier : "" },
      };
    });
    storeMemberSession(data);
    return data;
  }

  // Reward Land's login field is called `email` but accepts email or mobile.
  const data = await request("login", { email: identifier, password });
  storeMemberSession(data);
  return data;
}
