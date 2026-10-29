import { useEffect } from "react";

import "../css/signups-closed-modal.css";

/**
 * New memberships are paused. While this is true every "Subscribe" / "Join"
 * entry point shows the sign-ups-closed artwork instead of a checkout. Flip it
 * back to false to reopen sales — nothing else needs to change.
 */
export const SIGNUPS_CLOSED = true;

/** The "Sign-ups Now Closed" artwork as a popup, in place of the membership checkout. */
export default function SignupsClosedModal({ open, onClose }) {
  // Close on Escape, and don't let the page scroll behind the popup.
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

  return (
    <div className="cpsc-overlay" onClick={onClose} role="presentation">
      <div
        className="cpsc-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Sign-ups now closed"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="cpsc-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <img
          src="/images/Clubpass_Banner_Singup_closed.png"
          alt="Sign-ups now closed. We are no longer accepting new founding members. Thank you to everyone who joined early."
        />
      </div>
    </div>
  );
}
