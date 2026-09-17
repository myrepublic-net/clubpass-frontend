import { useCallback, useEffect, useRef, useState } from "react";

import { captureTicketOrder, createTicketOrder } from "../api/subscribe.js";
import { SIMULATE } from "./useMembershipCheckout.js";
import usePaypalSdk, { CURRENCY, IS_SANDBOX, sessionMethods } from "./usePaypalSdk.js";

const PRICE_LABEL = "ClubPass tickets";

/** Same look as the membership card fields — PayPal styles the text inside its iframes. */
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
 * Paying for event tickets on PayPal Web SDK v6 — a plain one-time charge,
 * nothing vaulted. The Lambda prices the basket from Strapi, opens the PayPal
 * order and writes a pending Strapi order; the browser approves it with the
 * chosen method; the Lambda captures, marks the order paid and deducts stock.
 *
 * `onPaid` receives `{ bookingReference, transactionId, email, total }`.
 */
export default function useTicketCheckout({
  active,
  method,
  ticketId,
  quantities,
  total,
  userName,
  email,
  accessToken,
  onPaid,
}) {
  const { status: sdkStatus, sdk, eligible, error: sdkError } = usePaypalSdk(active && !SIMULATE);

  const [flow, setFlow] = useState({ status: "idle" });

  const cardHostRef = useRef(null);
  const cardSessionRef = useRef(null);

  // Approval can surface twice (callback and promise); capture exactly once.
  const capturedRef = useRef(new Set());

  const latest = useRef({});
  latest.current = { ticketId, quantities, total, userName, email, accessToken, onPaid };

  useEffect(() => {
    if (active) setFlow({ status: "idle" });
  }, [active]);

  const fail = useCallback((error, message) => {
    console.error("Ticket payment failed", error);
    setFlow({
      status: "error",
      // Lambda errors (sold out, limit reached, price changed) are written for
      // the buyer, so they're shown as-is.
      message: message ?? error?.message ?? "That payment didn't go through. Please try again.",
    });
  }, []);

  const openOrder = useCallback((payMethod) => {
    const { ticketId: id, quantities: qty, total: expected, userName: name, email: mail, accessToken: token } =
      latest.current;

    return createTicketOrder({
      ticketId: id,
      quantities: qty,
      method: payMethod,
      userName: name ?? undefined,
      email: mail || undefined,
      accessToken: token ?? undefined,
      expectedTotal: expected,
    });
  }, []);

  const capture = useCallback(async (orderId) => {
    if (!orderId || capturedRef.current.has(orderId)) return;
    capturedRef.current.add(orderId);

    setFlow({ status: "processing" });
    const result = await captureTicketOrder({ orderId });
    setFlow({ status: "idle" });
    latest.current.onPaid?.(result);
  }, []);

  /* ---- Card fields ------------------------------------------------------ */

  useEffect(() => {
    if (!active || method !== "card" || sdkStatus !== "ready" || !cardHostRef.current) return;

    const session = sdk.createCardFieldsOneTimePaymentSession();
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
  }, [active, method, sdkStatus, sdk]);

  const payWithCard = useCallback(async () => {
    const session = cardSessionRef.current;
    if (!session) {
      fail(new Error("card fields not ready"), "Card payment is still loading. Please try again.");
      return;
    }

    setFlow({ status: "processing" });

    try {
      const { orderId } = await openOrder("card");
      const { state } = await session.submit(orderId);

      if (state === "canceled") {
        setFlow({ status: "idle" });
        return;
      }

      if (state !== "succeeded") {
        fail(new Error(`card submit ${state}`), "That card was declined. Try another one.");
        return;
      }

      await capture(orderId);
    } catch (error) {
      fail(error);
    }
  }, [openOrder, capture, fail]);

  /* ---- Google Pay ------------------------------------------------------- */

  const payWithGooglePay = useCallback(async () => {
    try {
      const session = sdk.createGooglePayOneTimePaymentSession();
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
          totalPrice: Number(latest.current.total).toFixed(2),
          totalPriceLabel: PRICE_LABEL,
        },
      });

      setFlow({ status: "processing" });

      const { orderId } = await openOrder("googlepay");
      await session.confirmOrder({ orderId, paymentMethodData: paymentData.paymentMethodData });
      await capture(orderId);
    } catch (error) {
      if (error?.statusCode === "CANCELED") {
        setFlow({ status: "idle" });
        return;
      }
      fail(error);
    }
  }, [sdk, openOrder, capture, fail]);

  /* ---- Apple Pay -------------------------------------------------------- */

  const payWithApplePay = useCallback(async () => {
    try {
      const session = sdk.createApplePayOneTimePaymentSession();
      const getConfig = pick(session, ["config", "getApplePayConfig"], "Apple Pay");
      const config = await getConfig();

      const applePay = new window.ApplePaySession(4, {
        countryCode: config.countryCode ?? "SG",
        currencyCode: CURRENCY,
        merchantCapabilities: config.merchantCapabilities,
        supportedNetworks: config.supportedNetworks,
        requiredBillingContactFields: ["postalAddress"],
        total: { label: PRICE_LABEL, amount: Number(latest.current.total).toFixed(2), type: "final" },
      });

      applePay.onvalidatemerchant = async (event) => {
        try {
          const { merchantSession } = await session.validateMerchant({
            validationUrl: event.validationURL,
          });
          applePay.completeMerchantValidation(merchantSession);
        } catch (error) {
          applePay.abort();
          fail(
            error,
            `Apple Pay isn't set up for ${window.location.hostname} yet. ` +
              "The domain has to be registered with PayPal first.",
          );
        }
      };

      applePay.onpaymentauthorized = async (event) => {
        try {
          setFlow({ status: "processing" });

          const { orderId } = await openOrder("applepay");
          await session.confirmOrder({
            orderId,
            token: event.payment.token,
            billingContact: event.payment.billingContact,
          });

          applePay.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          await capture(orderId);
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
  }, [sdk, openOrder, capture, fail]);

  /** Runs the selected method. Dev builds without a Lambda approve locally. */
  const pay = useCallback(async () => {
    if (SIMULATE) {
      setFlow({ status: "processing" });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const [n] = crypto.getRandomValues(new Uint32Array(1));
      setFlow({ status: "idle" });
      latest.current.onPaid?.({
        bookingReference: `${latest.current.userName ? "CP" : "GC"}-${String(n % 10_000_000).padStart(7, "0")}`,
        transactionId: null,
        email: latest.current.email ?? "",
        total: latest.current.total,
      });
      return;
    }

    setFlow({ status: "idle" });
    if (method === "card") return payWithCard();
    if (method === "googlepay") return payWithGooglePay();
    if (method === "applepay") return payWithApplePay();
  }, [method, payWithCard, payWithGooglePay, payWithApplePay]);

  return { flow, sdkStatus, sdkError, eligible, cardHostRef, pay };
}
