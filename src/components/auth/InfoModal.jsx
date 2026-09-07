import { useEffect } from "react";

/** The Terms of Use / Privacy Policy popup opened from the signup footer. */
export default function InfoModal({ title, children, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="auth-modal-head">
          <h2>{title}</h2>
          <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="auth-modal-body">{children}</div>
      </div>
    </div>
  );
}
