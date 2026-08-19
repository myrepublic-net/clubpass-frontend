import { useCallback, useEffect, useRef, useState } from "react";

import { markUserPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import {
  activateSubscription,
  captureOrder,
  createOrder,
  createSetupToken,
  createSubscription,
  subscribeWithCard,
} from "../api/subscribe.js";
import usePaypalSdk, { CURRENCY, IS_SANDBOX, sessionMethods } from "../hooks/usePaypalSdk.js";
import BoardingQr from "./BoardingQr.jsx";
import { useClubpassUser } from "./clubpassUserContext.js";
import "../css/subscribe-modal.css";

const PRICE = import.meta.env.VITE_CLUBPASS_PRICE ?? "19.90";
const PRICE_LABEL = "ClubPass · Home Express";

// Without a Lambda to talk to there is no checkout at all, so dev builds get a
// simulated approval that runs the identical Strapi activation. Setting
// VITE_SUBSCRIBE_API_URL switches it off, and it never exists in a production build.
const SIMULATE = import.meta.env.DEV && !import.meta.env.VITE_SUBSCRIBE_API_URL;

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

const METHOD_LABELS = {
  paypal: "PayPal",
  card: "Debit or credit card",
  googlepay: "Google Pay",
  applepay: "Apple Pay",
};

/**
 * ClubPass checkout on PayPal Web SDK v6.
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
 * On approval we write the membership onto the Strapi user: payer email, 4
 * trips, paid-on timestamp, a fresh 6-digit secret code and the PayPal
 * subscription or capture id as the transaction id.
 */
export default function SubscribeModal({ open, onClose }) {
  const { userName, user, profile, setUser } = useClubpassUser();
  const { status: sdkStatus, sdk, eligible, error: sdkError } = usePaypalSdk(
    open && !SIMULATE,
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
  const latest = useRef({ userName, user, profile, setUser, onClose });
  latest.current = { userName, user, profile, setUser, onClose };

  // Close on Escape, and don't let the page scroll behind the sheet.
  useEffect(() => {
    if (!open) return;

    setFlow({ status: "idle" });
    setMethod(null);

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  /** Writes the membership to Strapi once a payment is approved. */
  const activate = useCallback(async ({ transactionId, email, closeOnSuccess = false }) => {
    setFlow({ status: "processing" });

    try {
      const { userName: name, user: current, setUser: commit, onClose: close } = latest.current;
      // The gate's lookup can have failed — resolve again rather than drop a
      // payment we've already taken.
      const record = current ?? (await resolveClubpassUser(name));

      const updated = await markUserPaid({
        documentId: record.documentId,
        userName: record.userName ?? name,
        email,
        transactionId,
      });

      // The success screen's QR reads the user off the context, so commit before
      // switching to it.
      commit(updated ?? record);

      // A simulated payment has no receipt to show — drop the sheet and let the
      // live pass on the page behind it be the confirmation.
      if (closeOnSuccess) close();
      else setFlow({ status: "success" });
    } catch (error) {
      console.error("ClubPass membership save failed", error);
      setFlow({ status: "saveFailed", transactionId });
    }
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

      const { transactionId, email } = await captureOrder({
        orderId,
        method: payMethod,
        userName: latest.current.userName,
      });

      await activate({
        transactionId,
        email: email || latest.current.profile?.email || "",
        closeOnSuccess: true,
      });
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
            const { email } = await activateSubscription({
              subscriptionId: data.subscriptionId,
              userName: latest.current.userName,
            });
            await activate({
              transactionId: data.subscriptionId,
              email: email || latest.current.profile?.email || "",
              closeOnSuccess: true,
            });
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
        const { transactionId, email } = await subscribeWithCard({
          setupTokenId,
          userName: latest.current.userName,
          email: latest.current.profile?.email,
        });

        await activate({
          transactionId,
          email: email || latest.current.profile?.email || "",
          closeOnSuccess: true,
        });
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
      // whichever comes first subscribes, and subscribedRef stops the other.
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

      console.log("[applepay] starting with", {
        countryCode: config.countryCode ?? "SG",
        currencyCode: CURRENCY,
        supportedNetworks: config.supportedNetworks,
        merchantCapabilities: config.merchantCapabilities,
      });

      applePay.begin();
    } catch (error) {
      fail(error);
    }
  }, [sdk, captureAndActivate, fail]);

  /* ---- Rendering -------------------------------------------------------- */

  const choose = (id) => {
    setMethod(id);
    setFlow({ status: "idle" });

    // Card is the only one that stays on our page; the rest open PayPal's,
    // Google's or Apple's sheet, so the tap that picks them starts them.
    if (id === "paypal") payWithPayPal();
    if (id === "googlepay") payWithGooglePay();
    if (id === "applepay") payWithApplePay();
  };

  const simulate = () =>
    activate({
      transactionId: `I-SANDBOX${Date.now().toString().slice(-9)}`,
      email: profile?.email ?? `${userName}@sandbox.example.com`,
      closeOnSuccess: true,
    });

  if (!open) return null;

  const isSuccess = flow.status === "success";
  const available = Object.keys(METHOD_LABELS).filter((id) => eligible?.[id]);

  return (
    <div className="cps-overlay" onClick={onClose} role="presentation">
      <div
        className="cps-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Subscribe to ClubPass"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="cps-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {isSuccess ? (
          <div className="cps-success">
            <span className="cps-tick" aria-hidden="true">
              ✓
            </span>
            <h2>You're in, {userName}</h2>
            <p>Your ClubPass is active — 4 nights loaded and ready.</p>

            {user?.token && (
              <div className="cps-code">
                <small>Your boarding pass</small>
                <BoardingQr size={216} />
              </div>
            )}

            <p className="cps-fine">Show this QR to the driver at boarding.</p>
            <button type="button" className="cps-cta" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <header className="cps-head">
              <h2>ClubPass · Home Express</h2>
              <div className="cps-amount">
                <b>S${PRICE}</b>
                <i>/month</i>
              </div>
              <p>Auto-renews monthly · Cancel anytime</p>
            </header>

            {SIMULATE && flow.status === "idle" && (
              <div className="cps-sim">
                <p>
                  Sandbox mode — no checkout API configured. This runs the real activation against
                  Strapi with a fake transaction id.
                </p>
                <button type="button" className="cps-cta" onClick={simulate}>
                  Simulate successful payment
                </button>
              </div>
            )}

            {sdkStatus === "loading" && (
              <div className="cps-state">
                <span className="cps-spinner" role="status" aria-label="Loading PayPal" />
                <p>Loading secure checkout…</p>
              </div>
            )}

            {sdkStatus === "error" && <p className="cps-error">{sdkError}</p>}

            {/* Stays mounted through every state. Unmounting it while a card
                is being submitted would tear down PayPal's field iframes
                mid-flight and the submit would never settle. */}
            {sdkStatus === "ready" && (
              <div className={`cps-methods${flow.status === "idle" ? "" : " is-hidden"}`}>
                {available.length === 0 && (
                  <p className="cps-error">No payment method is available in this browser.</p>
                )}

                {available.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`cps-method cps-method-${id}${method === id ? " is-open" : ""}`}
                    onClick={() => choose(id)}
                  >
                    <span className="cps-method-label">{METHOD_LABELS[id]}</span>
                    <span className={`cps-logo cps-logo-${id}`} aria-hidden="true" />
                  </button>
                ))}

                {/* Kept mounted while card is picked — remounting would tear
                    down PayPal's field iframes mid-entry. */}
                <div className={`cps-card${method === "card" ? "" : " is-hidden"}`}>
                  <div className="cps-card-fields" ref={cardHostRef} />
                  <button type="button" className="cps-cta" onClick={payWithCard}>
                    Pay S${PRICE}
                  </button>
                  <p className="cps-fine">
                    Your card is saved securely with PayPal and charged monthly. Cancel anytime.
                  </p>
                </div>
              </div>
            )}

            {flow.status === "processing" && (
              <div className="cps-state">
                <span className="cps-spinner" role="status" aria-label="Activating" />
                <p>Activating your pass…</p>
              </div>
            )}

            {flow.status === "error" && (
              <>
                <p className="cps-error">
                  {flow.message}
                  {flow.detail && <small className="cps-error-detail">{flow.detail}</small>}
                </p>
                <button type="button" className="cps-cta" onClick={() => setFlow({ status: "idle" })}>
                  Try again
                </button>
              </>
            )}

            {flow.status === "saveFailed" && (
              <p className="cps-error">
                Your payment went through, but we couldn't activate the pass automatically. Contact
                support with reference <b>{flow.transactionId}</b> and we'll sort it out.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
