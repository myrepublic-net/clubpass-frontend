import { useCallback, useEffect, useRef, useState } from "react";

import { markUserPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import {
  activateSubscription,
  captureOrder,
  createOrder,
  createSubscription,
} from "../api/subscribe.js";
import usePaypalSdk, { CURRENCY, IS_SANDBOX } from "../hooks/usePaypalSdk.js";
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
    setFlow({ status: "error", message: message ?? "That payment didn't go through. Please try again." });
  }, []);

  /** Shared tail of the three wallet/card routes: capture, then hand to Strapi. */
  const captureAndActivate = useCallback(
    async (orderId, payMethod) => {
      setFlow({ status: "processing" });

      const { transactionId, email } = await captureOrder({
        orderId,
        method: payMethod,
        userName: latest.current.userName,
      });

      await activate({ transactionId, email: email || latest.current.profile?.email || "" });
    },
    [activate],
  );

  /* ---- PayPal: a real subscription, renewed by PayPal ------------------- */

  const payWithPayPal = useCallback(async () => {
    try {
      const session = sdk.createPayPalSubscriptionSession({
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

  // Mounting is a side effect of picking the card tile: the fields are PayPal
  // iframes and have to live in the DOM before anything can be typed into them.
  useEffect(() => {
    if (method !== "card" || sdkStatus !== "ready" || !cardHostRef.current) return;

    const session = sdk.createCardFieldsOneTimePaymentSession({
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
  }, [method, sdkStatus, sdk, fail]);

  const payWithCard = useCallback(async () => {
    const session = cardSessionRef.current;
    if (!session) return;

    setFlow({ status: "processing" });

    try {
      const { orderId } = await createOrder({
        method: "card",
        userName: latest.current.userName,
        email: latest.current.profile?.email,
      });

      const { state } = await session.submit(orderId);

      if (state === "canceled") {
        setFlow({ status: "idle" });
        return;
      }
      if (state !== "succeeded") {
        fail(new Error(`card submit returned ${state}`), "That card was declined. Try another one.");
        return;
      }

      await captureAndActivate(orderId, "card");
    } catch (error) {
      fail(error);
    }
  }, [captureAndActivate, fail]);

  /* ---- Google Pay ------------------------------------------------------- */

  const payWithGooglePay = useCallback(async () => {
    try {
      const session = sdk.createGooglePayOneTimePaymentSession();
      const config = await session.getGooglePayConfig();

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
      const config = await session.config();

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
        try {
          const { merchantSession } = await session.validateMerchant({
            validationUrl: event.validationURL,
          });
          applePay.completeMerchantValidation(merchantSession);
        } catch (error) {
          applePay.abort();
          fail(error);
        }
      };

      applePay.onpaymentauthorized = async (event) => {
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

          applePay.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          await captureAndActivate(orderId, "applepay");
        } catch (error) {
          applePay.completePayment(window.ApplePaySession.STATUS_FAILURE);
          fail(error);
        }
      };

      applePay.oncancel = () => setFlow({ status: "idle" });

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

            {sdkStatus === "ready" && flow.status === "idle" && (
              <div className="cps-methods">
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
                <p className="cps-error">{flow.message}</p>
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
