import { useEffect } from "react";

import useMembershipCheckout, { SIMULATE } from "../hooks/useMembershipCheckout.js";
import BoardingQr from "./BoardingQr.jsx";
import { useClubpassUser } from "./clubpassUserContext.js";
import "../css/subscribe-modal.css";

const METHOD_LABELS = {
  paypal: "PayPal",
  card: "Debit or credit card",
  googlepay: "Google Pay",
  applepay: "Apple Pay",
};

/**
 * ClubPass checkout as a bottom sheet. Everything about taking the payment
 * lives in useMembershipCheckout — this is the sheet's chrome, the method
 * tiles and the card fields' host, and it closes itself once the membership
 * is on the record.
 */
export default function SubscribeModal({ open, onClose }) {
  const { userName, user, profile, setUser } = useClubpassUser();

  const {
    flow,
    setFlow,
    method,
    sdkStatus,
    sdkError,
    eligible,
    cardHostRef,
    choose,
    payWithCard,
    simulatePayment,
    price,
  } = useMembershipCheckout({
    active: open,
    userName,
    user,
    profile,
    setUser,
    onPaid: onClose,
  });

  // Close on Escape, and don't let the page scroll behind the sheet.
  useEffect(() => {
    if (!open) return;

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

  if (!open) return null;

  const isSuccess = flow.status === "success";
  const available = Object.keys(METHOD_LABELS).filter((id) => eligible?.[id]);

  return (
    <div className="cps-overlay" onClick={onClose} role="presentation">
      <div
        className="cps-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Subscribe to Clubpass"
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
            <p>Your Clubpass is active — 4 nights loaded and ready.</p>

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
              <h2>Clubpass · Home Express</h2>
              <div className="cps-amount">
                <b>S${price}</b>
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
                <button type="button" className="cps-cta" onClick={simulatePayment}>
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
                    Pay S${price}
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
