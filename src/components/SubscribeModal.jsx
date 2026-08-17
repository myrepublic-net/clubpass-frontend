import { useCallback, useEffect, useRef, useState } from "react";

import { markUserPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import usePaypalSdk from "../hooks/usePaypalSdk.js";
import BoardingQr from "./BoardingQr.jsx";
import { useClubpassUser } from "./clubpassUserContext.js";
import "../css/subscribe-modal.css";

const PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_ID;

// A plan id can't be faked — PayPal validates it against the merchant account —
// so until a real sandbox plan is configured, dev builds get a simulated
// approval that runs the identical Strapi activation. Setting VITE_PAYPAL_PLAN_ID
// switches it off, and it never exists in a production build.
const SIMULATE = import.meta.env.DEV && !PLAN_ID;

/**
 * PayPal subscription checkout. On approval we write the membership onto the
 * Strapi user: payer email, 4 trips, paid-on timestamp, a fresh 6-digit secret
 * code and the PayPal subscription id as the transaction id.
 */
export default function SubscribeModal({ open, onClose }) {
  const { userName, user, setUser } = useClubpassUser();
  const { status: sdkStatus, paypal, error: sdkError } = usePaypalSdk(open && !SIMULATE);

  const containerRef = useRef(null);
  const [flow, setFlow] = useState({ status: "idle" });

  // PayPal binds its callbacks once at render time, so read the live values
  // through a ref instead of closing over the ones from that render.
  const latest = useRef({ userName, user, setUser, onClose });
  latest.current = { userName, user, setUser, onClose };

  // Close on Escape, and don't let the page scroll behind the sheet.
  useEffect(() => {
    if (!open) return;

    setFlow({ status: "idle" });

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

  /** Writes the membership to Strapi once a subscription is approved. */
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
      setFlow({ status: "saveFailed", subscriptionId: transactionId });
    }
  }, []);

  useEffect(() => {
    if (!open || sdkStatus !== "ready" || !containerRef.current) return;

    if (!PLAN_ID) {
      setFlow({ status: "error", message: "PayPal isn't configured — VITE_PAYPAL_PLAN_ID is missing." });
      return;
    }

    const buttons = paypal.Buttons({
      style: { shape: "pill", color: "gold", layout: "vertical", label: "subscribe" },

      createSubscription: (data, actions) => actions.subscription.create({ plan_id: PLAN_ID }),

      onApprove: async (data, actions) => {
        setFlow({ status: "processing" });

        let email = "";
        try {
          const details = await actions.subscription.get();
          email = details?.subscriber?.email_address ?? "";
        } catch (error) {
          // The email is a nice-to-have; never fail the save over it.
          console.warn("Couldn't read the PayPal payer email", error);
        }

        await activate({ transactionId: data.subscriptionID, email });
      },

      onCancel: () => setFlow({ status: "idle" }),

      onError: (error) => {
        console.error("PayPal checkout error", error);
        setFlow({ status: "error", message: "PayPal couldn't process that. Please try again." });
      },
    });

    if (!buttons.isEligible()) {
      setFlow({ status: "error", message: "PayPal isn't available in this browser." });
      return;
    }

    buttons.render(containerRef.current).catch((error) => {
      console.error("PayPal button render failed", error);
    });

    return () => {
      buttons.close().catch(() => {});
    };
    // Bound once per open — re-running would tear the buttons down mid-checkout.
  }, [open, sdkStatus, paypal, activate]);

  const simulate = () =>
    activate({
      transactionId: `I-SANDBOX${Date.now().toString().slice(-9)}`,
      email: `${userName}@sandbox.example.com`,
      closeOnSuccess: true,
    });

  if (!open) return null;

  const isSuccess = flow.status === "success";

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
                <b>S$19.90</b>
                <i>/month</i>
              </div>
              <p>Auto-renews monthly · Cancel anytime</p>
            </header>

            {SIMULATE && flow.status === "idle" && (
              <div className="cps-sim">
                <p>
                  Sandbox mode — no PayPal plan configured. This runs the real activation against
                  Strapi with a fake subscription id.
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

            {/* Stays mounted through every state — unmounting it mid-checkout
                would tear down PayPal's iframe. */}
            <div
              ref={containerRef}
              className={`cps-paypal${flow.status === "idle" ? "" : " is-hidden"}`}
            />

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
                support with reference <b>{flow.subscriptionId}</b> and we'll sort it out.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
