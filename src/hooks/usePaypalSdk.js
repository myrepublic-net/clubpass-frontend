import { useEffect, useState } from "react";

import { fetchClientToken } from "../api/subscribe.js";

/**
 * PayPal Web SDK v6.
 *
 * v6 is a different animal from v5: one core script, an SDK *instance* built
 * from a server-minted client token, and a session object per payment method
 * instead of paypal.Buttons. The instance is shared by all four methods —
 * PayPal, card fields, Google Pay, Apple Pay — so it's built once here.
 */

/** Sandbox and live serve different SDK hosts, and a token from one won't work on the other. */
export const IS_SANDBOX = (import.meta.env.VITE_PAYPAL_ENV ?? "sandbox") !== "live";

const SDK_URL = IS_SANDBOX
  ? "https://www.sandbox.paypal.com/web-sdk/v6/core"
  : "https://www.paypal.com/web-sdk/v6/core";

/** Google Pay's own library. Loaded alongside — PayPal drives it but doesn't ship it. */
const GOOGLE_PAY_URL = "https://pay.google.com/gp/p/js/pay.js";

/**
 * A client id is public — it identifies the merchant, it doesn't authorise
 * anything — so the SDK initialises straight from it and the page is usable
 * before the Lambda has answered anything. Only if there's no client id
 * configured do we fall back to a server-minted client token.
 */
const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

/** Everything the modal can offer. Unlisted components simply aren't loaded. */
const COMPONENTS = [
  "paypal-payments",
  "card-fields",
  "googlepay-payments",
  "applepay-payments",
];

/**
 * Subscriptions moved. Some v6 releases ship them as their own component,
 * others fold them into paypal-payments and reject the name outright — so ask
 * for it, and drop it if the SDK objects rather than losing every method.
 */
const SUBSCRIPTIONS_COMPONENT = "paypal-subscriptions";

async function instantiate(auth) {
  const options = { ...auth, pageType: "checkout" };

  try {
    return await window.paypal.createInstance({
      ...options,
      components: [...COMPONENTS, SUBSCRIPTIONS_COMPONENT],
    });
  } catch (error) {
    console.warn(
      `[paypal] "${SUBSCRIPTIONS_COMPONENT}" was rejected, retrying without it:`,
      error?.message ?? error,
    );
    return window.paypal.createInstance({ ...options, components: COMPONENTS });
  }
}

/** Every method an SDK instance or session actually has, own properties and prototype alike. */
export function sessionMethods(sdk) {
  const names = new Set();

  for (let object = sdk; object && object !== Object.prototype; object = Object.getPrototypeOf(object)) {
    for (const key of Object.getOwnPropertyNames(object)) {
      if (key !== "constructor" && typeof sdk[key] === "function") names.add(key);
    }
  }

  return [...names].sort();
}

export const CURRENCY = import.meta.env.VITE_PAYPAL_CURRENCY ?? "SGD";

const scripts = new Map();

/** Loads a script once per URL and remembers the promise. */
function loadScript(src) {
  let pending = scripts.get(src);

  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        reject(new Error("Couldn't reach PayPal. Check your connection and try again."));
      };
      document.head.appendChild(script);
    });

    // Never cache a failure — the next open should be able to retry.
    pending.catch(() => scripts.delete(src));
    scripts.set(src, pending);
  }

  return pending;
}

/** Whichever of the two credentials v6 will accept, as the key it expects. */
async function credentials() {
  if (CLIENT_ID) return { clientId: CLIENT_ID };

  const clientToken = await fetchClientToken();
  if (clientToken) return { clientToken };

  throw new Error(
    "PayPal isn't configured — set VITE_PAYPAL_CLIENT_ID, or deploy the checkout Lambda so it can mint a client token.",
  );
}

let instancePromise = null;

/**
 * Builds the SDK instance and asks PayPal which methods this buyer can actually
 * use. Eligibility is per browser and per currency — Apple Pay only answers on
 * Safari, Google Pay needs a supported browser and a saved card — so the modal
 * shows a method only once PayPal says it's live.
 */
function createSdk() {
  if (instancePromise) return instancePromise;

  instancePromise = (async () => {
    // Credentials are a round trip to our Lambda at worst; the scripts are a
    // round trip to Google and PayPal. No reason to do them one after the other.
    const [auth] = await Promise.all([
      credentials(),
      loadScript(SDK_URL),
      loadScript(GOOGLE_PAY_URL).catch(() => {
        // Google Pay being unreachable shouldn't cost us the other three methods.
        console.warn("Google Pay script failed to load");
      }),
    ]);

    const sdk = await instantiate(auth);

    // The one list that settles "is not a function" questions.
    console.log(
      "[paypal] sdk sessions:",
      sessionMethods(sdk).filter((name) => name.startsWith("create")),
    );

    const methods = await sdk.findEligibleMethods({ currencyCode: CURRENCY });

    // An unknown key throws rather than returning false, and the set PayPal
    // accepts has changed between v6 releases — so ask defensively.
    const can = (name) => {
      try {
        return Boolean(methods.isEligible(name));
      } catch {
        return false;
      }
    };

    // Two different card integrations share the word "card": `advanced_cards`
    // is the hosted card-fields path this app uses, `card` is PayPal's basic
    // guest-card page. Only the first one tells us the fields will work.
    const eligible = {
      paypal: can("paypal"),
      card: can("advanced_cards"),
      googlepay: can("googlepay") && Boolean(window.google?.payments),
      applepay: can("applepay") && Boolean(window.ApplePaySession?.canMakePayments?.()),
    };

    // What PayPal said, before our own browser gating — the only way to tell a
    // method the account can't do from one this browser can't show.
    console.log("[paypal] merchant eligibility:", {
      paypal: can("paypal"),
      advanced_cards: can("advanced_cards"),
      card: can("card"),
      googlepay: can("googlepay"),
      applepay: can("applepay"),
      paylater: can("paylater"),
      venmo: can("venmo"),
    });
    console.log("[paypal] this browser:", {
      googlePayScript: Boolean(window.google?.payments),
      applePaySession: Boolean(window.ApplePaySession),
      applePayCanMakePayments: Boolean(window.ApplePaySession?.canMakePayments?.()),
      currency: CURRENCY,
      env: IS_SANDBOX ? "sandbox" : "live",
    });
    console.log("[paypal] showing:", eligible);

    return { sdk, eligible };
  })();

  instancePromise.catch(() => {
    instancePromise = null;
  });

  return instancePromise;
}

/** Builds the v6 SDK instance when `enabled` flips true (i.e. when the modal opens). */
export default function usePaypalSdk(enabled) {
  const [state, setState] = useState({ status: "idle", sdk: null, error: null });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setState({ status: "loading", sdk: null, error: null });

    createSdk().then(
      (ready) => {
        if (!cancelled) setState({ status: "ready", ...ready, error: null });
      },
      (error) => {
        console.error("PayPal SDK v6 failed to initialise", error);
        if (!cancelled) setState({ status: "error", sdk: null, error: error.message });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
