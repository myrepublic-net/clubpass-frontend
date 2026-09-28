import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { logout } from "../api/auth.js";
import "../css/user-menu.css";

/**
 * The signed-in slot in every header: the member's initial in a circle, and
 * the account menu behind it.
 *
 * `onSignedOut` lets a page that keeps its own copy of the session drop it,
 * since signing out has to be visible before the navigation lands.
 */
export default function UserMenu({ userName, onSignedOut }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef(null);

  // Clicking anywhere else, or pressing Escape, closes the menu.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = (userName ?? "").trim().charAt(0).toUpperCase();

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
      setOpen(false);
      onSignedOut?.();
      navigate("/");
    }
  };

  return (
    <div className="usr" ref={wrapRef}>
      <button
        type="button"
        className="usr-avatar"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${userName}`}
      >
        {initial}
      </button>

      {open && (
        <div className="usr-menu" role="menu">
          <Link className="usr-item" to="/profile" role="menuitem" onClick={() => setOpen(false)}>
            Profile
          </Link>
          <button
            type="button"
            className="usr-item"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
          >
            {signingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
