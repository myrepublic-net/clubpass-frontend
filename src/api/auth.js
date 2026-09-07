/**
 * ClubPass self-serve auth — signup, login, and email/phone OTP.
 *
 * No backend for this exists yet (unlike sso.js / subscribe.js, which already
 * point at real Lambdas). Until VITE_AUTH_API_URL is set, every call here is
 * simulated locally: OTPs are generated in-memory, "sent" to the console, and
 * verified against what was generated — so the multi-step form works fully
 * offline while the real API is being built. Swap SIMULATE off by setting
 * VITE_AUTH_API_URL and this file talks to that endpoint instead; nothing
 * above it (the pages/components) needs to change.
 */

const API_URL = (import.meta.env.VITE_AUTH_API_URL ?? "").replace(/\/+$/, "");
const SIMULATE = !API_URL;

async function call(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.error) {
    const error = new Error(body?.error ?? `Request failed (${res.status})`);
    error.action = action;
    throw error;
  }

  return body;
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

export function requestEmailOtp(email) {
  if (SIMULATE) return simulateSendOtp(email);
  return call("request-email-otp", { email });
}

export function verifyEmailOtp(email, otp) {
  if (SIMULATE) return simulateVerifyOtp(email, otp);
  return call("verify-email-otp", { email, otp });
}

/* ---- phone OTP ------------------------------------------------------------ */

export function requestPhoneOtp(phoneNumber) {
  if (SIMULATE) return simulateSendOtp(phoneNumber);
  return call("request-phone-otp", { phoneNumber });
}

export function verifyPhoneOtp(phoneNumber, otp) {
  if (SIMULATE) return simulateVerifyOtp(phoneNumber, otp);
  return call("verify-phone-otp", { phoneNumber, otp });
}

/* ---- account ---------------------------------------------------------------- */

export function signup({
  username,
  email,
  phoneNumber,
  password,
  referralCode,
  promoCode,
  marketingOptIn,
}) {
  if (SIMULATE) {
    return delay(700).then(() => {
      console.warn("[auth:simulate] signup", {
        username,
        email,
        phoneNumber,
        referralCode,
        promoCode,
        marketingOptIn,
      });
      return { user: { username, email, phoneNumber } };
    });
  }

  return call("signup", {
    username,
    email,
    phoneNumber,
    password,
    referralCode,
    promoCode,
    marketingOptIn,
  });
}

export function login({ identifier, password }) {
  if (SIMULATE) {
    return delay(700).then(() => {
      console.warn("[auth:simulate] login", { identifier });
      return { user: { username: identifier } };
    });
  }

  return call("login", { identifier, password });
}
