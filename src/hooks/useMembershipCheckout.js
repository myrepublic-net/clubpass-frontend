import { useCallback, useEffect, useRef, useState } from "react";

import {
  activateSubscription,
  captureOrder,
  createOrder,
  createSetupToken,
  createSubscription,
  subscribeWithCard,
} from "../api/subscribe.js";
import usePaypalSdk, { CURRENCY, IS_SANDBOX, sessionMethods } from "./usePaypalSdk.js";

const PRICE = import.meta.env.VITE_CLUBPASS_PRICE ?? "19.90";
const PRICE_LABEL = "Clubpass · Home Express";

// Without a Lambda to talk to there is no checkout at all, so dev builds get a
// simulated approval that runs the identical Strapi activation. Setting
// VITE_SUBSCRIBE_API_URL switches it off, and it never exists in a production build.
export const SIMULATE = import.meta.env.DEV && !import.meta.env.VITE_SUBSCRIBE_API_URL;

/** Card fields are PayPal-hosted iframes, so their text is styled through this. */
const FIELD_STYLE = {
  input: {
    "font-family": "Outfit, ui-sans-serif, system-ui, sans-serif",
    "font-size": "15px",
    "font-weight": "500",
    color: "#191024",
    padding: "0",
  },
  ":focus": { color: "#191024" },
  ".invalid": { color: "#DC2626" },
};

/**
 * The SDK renamed createPayPalSubscriptionSession under us once already, so
 * session methods are looked up by any of their known names rather than called
 * by one — and if none is there, the error says which session and what it does
 * have instead of "undefined is not a function" from a minified bundle.
 */
function pick(session, names, label) {
  for (const name of names) {
    if (typeof session[name] === "function") return session[name].bind(session);
  }

  throw new Error(
    `${label}: none of ${names.join(" / ")} exist on this session. ` +
      `It has: ${sessionMethods(session).join(", ")}`,
  );
}

/**
 * Buying a Clubpass membership on PayPal Web SDK v6 — the payment half of
 * SubscribeModal, lifted out so the sheet and the in-page checkout on the
 * ticket flow can share one implementation rather than keeping two.
 *
 * Two routes to the same membership, because PayPal only lets one of them
 * renew itself:
 *
 *   PayPal  → a real billing-plan subscription; PayPal charges monthly.
 *   Card, Google Pay, Apple Pay → a one-month order that vaults the payment
 *     method, and our Lambda charges the saved method monthly from then on.
 *
 * Either way the order or subscription is created by the Lambda — v6 only ever
 * hands the browser an id to approve.
 *
 * On approval the membership is written onto the Strapi user (payer email, 4
 * trips, paid-on timestamp, a fresh 6-digit secret code and the PayPal
 * subscription or capture id), `setUser` is given the updated record, and
 * `onPaid` runs.
 *
 * The caller owns the UI: render `cardHostRef` somewhere once `method` is
 * "card", and drive everything else off `flow`.
 */
export default function useMembershipCheckout({
  active,
  userName,
  user,
  profile,
  setUser,
  onPaid,
}) {
  const { status: sdkStatus, sdk, eligible, error: sdkError } = usePaypalSdk(
    active && !SIMULATE,
  );

  const [flow, setFlow] = useState({ status: "idle" });
  const [method, setMethod] = useState(null);

  const cardHostRef = useRef(null);
  const cardSessionRef = useRef(null);

  // The order the card fields are about to submit — onApprove doesn't always
  // carry it back, and capture needs it.
  const cardOrderRef = useRef(null);

  // Approval can arrive twice: once through onApprove and once through the
  // submit() promise. Capturing twice is a second charge, so orders are only
  // ever captured once.
  const capturedRef = useRef(new Set());

  // PayPal binds its callbacks once, so read the live values through a ref
  // instead of closing over the ones from that render.
  const latest = useRef({ userName, user, profile, setUser, onPaid });
  latest.current = { userName, user, profile, setUser, onPaid };

  // Every fresh open starts from a clean slate.
  useEffect(() => {
    if (!active) return;
    setFlow({ status: "idle" });
    setMethod(null);
  }, [active]);

  /**
   * Hands the member record the Lambda wrote back to the caller. The Lambda
   * writes the membership itself as part of confirming the payment, so there
   * is nothing left for the browser to save.
   */
  const activate = useCallback(async ({ user: updated, transactionId }) => {
    const { setUser: commit, onPaid: done } = latest.current;

    if (!updated) {
      setFlow({ status: "saveFailed", transactionId });
      return;
    }

    // Anything reading the pass off this record needs it before the caller
    // switches screens.
    commit?.(updated);
    setFlow({ status: "idle" });
    done?.(updated);
  }, []);

  const fail = useCallback((error, message) => {
    console.error("ClubPass checkout failed", error);

    // The friendly line is for the member; the detail line is what makes a
    // failure diagnosable without opening a console on someone else's phone.
    setFlow({
      status: "error",
      message: message ?? "That payment didn't go through. Please try again.",
      detail: [error?.name, error?.message].filter(Boolean).join(": "),
    });
  }, []);

  /** Shared tail of the three wallet/card routes: capture, then hand to Strapi. */
  const captureAndActivate = useCallback(
    async (orderId, payMethod) => {
      if (!orderId || capturedRef.current.has(orderId)) return;
      capturedRef.current.add(orderId);

      setFlow({ status: "processing" });

      const { transactionId, user } = await captureOrder({
        orderId,
        method: payMethod,
        userName: latest.current.userName,
        email: latest.current.profile?.email,
      });

      await activate({ transactionId, user });
    },
    [activate],
  );

  /* ---- PayPal: a real subscription, renewed by PayPal ------------------- */

  const payWithPayPal = useCallback(async () => {
    try {
      // The reference documents this as createPayPalSubscriptionSession, but
      // the shipped SDK names it ...SubscriptionPaymentSession. Accept either,
      // so a rename in a later release doesn't break checkout again.
      const create =
        sdk.createPayPalSubscriptionPaymentSession ?? sdk.createPayPalSubscriptionSession;

      if (typeof create !== "function") {
        throw new Error(
          "This PayPal SDK build has no subscription session — see the " +
            "[paypal] sdk sessions list in the console for what it does have.",
        );
      }

      const session = create.call(sdk, {
        onApprove: async (data) => {
          setFlow({ status: "processing" });
          try {
            const { user } = await activateSubscription({
              subscriptionId: data.subscriptionId,
              userName: latest.current.userName,
              email: latest.current.profile?.email,
            });
            await activate({ transactionId: data.subscriptionId, user });
          } catch (error) {
            fail(error);
          }
        },
        onCancel: () => setFlow({ status: "idle" }),
        onError: (error) => fail(error),
      });

      await session.start(
        { presentationMode: "auto" },
        createSubscription({
          userName: latest.current.userName,
          email: latest.current.profile?.email,
        }).then(({ subscriptionId }) => ({ subscriptionId })),
      );
    } catch (error) {
      fail(error);
    }
  }, [sdk, activate, fail]);

  /* ---- Card fields ------------------------------------------------------ */

  /** Shared tail of the card route: swap the approved setup token for a subscription. */
  const subscribeWithSavedCard = useCallback(
    async (setupTokenId) => {
      if (!setupTokenId || capturedRef.current.has(setupTokenId)) return;
      capturedRef.current.add(setupTokenId);

      setFlow({ status: "processing" });

      try {
        const { transactionId, user } = await subscribeWithCard({
          setupTokenId,
          userName: latest.current.userName,
          email: latest.current.profile?.email,
        });

        await activate({ transactionId, user });
      } catch (error) {
        fail(error);
      }
    },
    [activate, fail],
  );

  // Mounting is a side effect of picking the card tile: the fields are PayPal
  // iframes and have to live in the DOM before anything can be typed into them.
  useEffect(() => {
    if (method !== "card" || sdkStatus !== "ready" || !cardHostRef.current) return;

    // A *save* session, not a one-time one: the fields vault the card rather
    // than buying anything, and the Lambda then starts a PayPal subscription
    // on the saved card. That's what makes card renew through PayPal itself.
    const session = sdk.createCardFieldsSavePaymentSession({
      // Approval arrives here on some builds and through submit() on others —
      // whichever comes first subscribes, and capturedRef stops the other.
      onApprove: (data) => {
        console.log("[card] onApprove", data);
        subscribeWithSavedCard(data?.setupTokenId ?? data?.vaultSetupToken ?? cardOrderRef.current);
      },
      onCancel: () => setFlow({ status: "idle" }),
      onError: (error) => fail(error),
    });
    cardSessionRef.current = session;

    const host = cardHostRef.current;
    const fields = [
      { type: "number", placeholder: "Card number", className: "cps-field cps-field-number" },
      { type: "expiry", placeholder: "MM / YY", className: "cps-field cps-field-expiry" },
      { type: "cvv", placeholder: "CVC", className: "cps-field cps-field-cvv" },
    ];

    for (const { type, placeholder, className } of fields) {
      const wrapper = document.createElement("div");
      wrapper.className = className;
      wrapper.appendChild(session.createCardFieldsComponent({ type, placeholder, style: FIELD_STYLE }));
      host.appendChild(wrapper);
    }

    return () => {
      host.replaceChildren();
      cardSessionRef.current = null;
    };
  }, [method, sdkStatus, sdk, fail, subscribeWithSavedCard]);

  const payWithCard = useCallback(async () => {
    const session = cardSessionRef.current;
    if (!session) return;

    setFlow({ status: "processing" });

    try {
      const { setupTokenId } = await createSetupToken({ userName: latest.current.userName });

      cardOrderRef.current = setupTokenId;
      console.log("[card] submitting setup token", setupTokenId);

      const result = await session.submit(setupTokenId);
      console.log("[card] submit resolved", result);

      const state = result?.state;

      if (state === "canceled") {
        setFlow({ status: "idle" });
        return;
      }

      if (state === "failed") {
        fail(new Error("card submit failed"), "That card was declined. Try another one.");
        return;
      }

      await subscribeWithSavedCard(setupTokenId);
    } catch (error) {
      fail(error);
    }
  }, [subscribeWithSavedCard, fail]);

  /* ---- Google Pay ------------------------------------------------------- */

  const payWithGooglePay = useCallback(async () => {
    try {
      const session = sdk.createGooglePayOneTimePaymentSession();
      console.log("[googlepay] session methods:", sessionMethods(session));

      const getConfig = pick(
        session,
        ["getGooglePayConfig", "config", "formatConfigForPaymentRequest"],
        "Google Pay",
      );
      const config = await getConfig();

      const client = new window.google.payments.api.PaymentsClient({
        environment: IS_SANDBOX ? "TEST" : "PRODUCTION",
      });

      const paymentData = await client.loadPaymentData({
        apiVersion: config.apiVersion,
        apiVersionMinor: config.apiVersionMinor,
        allowedPaymentMethods: config.allowedPaymentMethods,
        merchantInfo: config.merchantInfo,
        transactionInfo: {
          countryCode: config.countryCode ?? "SG",
          currencyCode: CURRENCY,
          totalPriceStatus: "FINAL",
          totalPrice: PRICE,
          totalPriceLabel: PRICE_LABEL,
        },
      });

      setFlow({ status: "processing" });

      const { orderId } = await createOrder({
        method: "googlepay",
        userName: latest.current.userName,
        email: latest.current.profile?.email,
      });

      await session.confirmOrder({
        orderId,
        paymentMethodData: paymentData.paymentMethodData,
      });

      await captureAndActivate(orderId, "googlepay");
    } catch (error) {
      // Closing the Google sheet is a cancel, not a failure.
      if (error?.statusCode === "CANCELED") {
        setFlow({ status: "idle" });
        return;
      }
      fail(error);
    }
  }, [sdk, captureAndActivate, fail]);

  /* ---- Apple Pay -------------------------------------------------------- */

  const payWithApplePay = useCallback(async () => {
    try {
      const session = sdk.createApplePayOneTimePaymentSession();
      console.log("[applepay] session methods:", sessionMethods(session));

      const getConfig = pick(session, ["config", "getApplePayConfig"], "Apple Pay");
      const config = await getConfig();

      const applePay = new window.ApplePaySession(4, {
        countryCode: config.countryCode ?? "SG",
        currencyCode: CURRENCY,
        merchantCapabilities: config.merchantCapabilities,
        supportedNetworks: config.supportedNetworks,
        requiredBillingContactFields: ["postalAddress"],
        total: { label: PRICE_LABEL, amount: PRICE, type: "final" },
      });

      // Apple will only talk to a domain PayPal has registered against the
      // merchant account — this is the handshake that proves it. The SDK does
      // the round trip for us, so there's no endpoint of ours involved.
      applePay.onvalidatemerchant = async (event) => {
        console.log("[applepay] validating merchant via", event.validationURL);

        try {
          const { merchantSession } = await session.validateMerchant({
            validationUrl: event.validationURL,
          });
          console.log("[applepay] merchant validated");
          applePay.completeMerchantValidation(merchantSession);
        } catch (error) {
          console.error("[applepay] merchant validation failed", error);
          applePay.abort();

          // Nearly always the domain: Apple will only accept a session for a
          // host PayPal has registered and served the association file for.
          fail(
            error,
            `Apple Pay isn't set up for ${window.location.hostname} yet. ` +
              "The domain has to be registered with PayPal first.",
          );
        }
      };

      applePay.onpaymentauthorized = async (event) => {
        console.log("[applepay] payment authorised, creating order");

        try {
          setFlow({ status: "processing" });

          const { orderId } = await createOrder({
            method: "applepay",
            userName: latest.current.userName,
            email: latest.current.profile?.email,
          });

          await session.confirmOrder({
            orderId,
            token: event.payment.token,
            billingContact: event.payment.billingContact,
          });

          console.log("[applepay] order confirmed, capturing");
          applePay.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          await captureAndActivate(orderId, "applepay");
        } catch (error) {
          console.error("[applepay] authorisation failed", error);
          applePay.completePayment(window.ApplePaySession.STATUS_FAILURE);
          fail(error);
        }
      };

      applePay.oncancel = () => {
        console.log("[applepay] cancelled by buyer");
        setFlow({ status: "idle" });
      };

      applePay.begin();
    } catch (error) {
      fail(error);
    }
  }, [sdk, captureAndActivate, fail]);

  /**
   * Picks a method. Card is the only one that stays on our page; the rest open
   * PayPal's, Google's or Apple's sheet, so choosing them starts them.
   */
  const choose = useCallback(
    (id) => {
      setMethod(id);
      setFlow({ status: "idle" });

      if (id === "paypal") payWithPayPal();
      if (id === "googlepay") payWithGooglePay();
      if (id === "applepay") payWithApplePay();
    },
    [payWithPayPal, payWithGooglePay, payWithApplePay],
  );

  /** Starts whichever method is already selected — for a separate "pay" button. */
  const start = useCallback(
    (id) => {
      if (id === "card") return payWithCard();
      return choose(id);
    },
    [choose, payWithCard],
  );

  /** Dev-only stand-in for an approval, running the identical Strapi activation. */
  // Dev-only, and deliberately not saved anywhere: the browser can no longer
  // write memberships, so this only flips the member on for this page view.
  const simulatePayment = useCallback(() => {
    const now = new Date();
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);

    return activate({
      transactionId: `I-SANDBOX${Date.now().toString().slice(-9)}`,
      user: {
        ...(latest.current.user ?? { userName: latest.current.userName }),
        paidOn: now.toISOString(),
        secretCode: "000000",
        tripLeft: 4,
        billingStatus: "active",
        nextBillingOn: next.toISOString(),
      },
    });
  }, [activate]);

  return {
    flow,
    setFlow,
    method,
    setMethod,
    sdkStatus,
    sdkError,
    eligible,
    cardHostRef,
    choose,
    start,
    payWithCard,
    simulatePayment,
    price: PRICE,
  };
}
