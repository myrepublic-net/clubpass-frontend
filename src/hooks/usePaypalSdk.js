import { useEffect, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

let sdkPromise = null;

/** Loads the PayPal JS SDK once, in subscription mode, and caches the result. */
function loadSdk() {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error("PayPal isn't configured — VITE_PAYPAL_CLIENT_ID is missing."));
      return;
    }

    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const params = new URLSearchParams({
      "client-id": CLIENT_ID,
      // Subscriptions are vaulted; the plan carries the price and currency.
      vault: "true",
      intent: "subscription",
    });

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => {
      script.remove();
      reject(new Error("Couldn't reach PayPal. Check your connection and try again."));
    };

    document.head.appendChild(script);
  });

  // Never cache a failure — the next open should be able to retry.
  sdkPromise.catch(() => {
    sdkPromise = null;
  });

  return sdkPromise;
}

/** Loads the PayPal SDK when `enabled` flips true (i.e. when the modal opens). */
export default function usePaypalSdk(enabled) {
  const [state, setState] = useState({ status: "idle", paypal: null, error: null });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setState({ status: "loading", paypal: null, error: null });

    loadSdk().then(
      (paypal) => {
        if (!cancelled) setState({ status: "ready", paypal, error: null });
      },
      (error) => {
        if (!cancelled) setState({ status: "error", paypal: null, error: error.message });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
