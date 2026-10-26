import { useState } from "react";
import { Link } from "react-router";
import { Menu } from "lucide-react";

import UserMenu from "./UserMenu.jsx";
import "../css/event-desktop.css";
import "../css/events-header.css";

/**
 * The header the events pages share — /events, /event-list, /my-tickets and
 * /profile. Logo on the left; Events, My Tickets (signed in) and the account
 * on the right. Below 1024px the links fold into a hamburger dropdown, as on
 * the home page, and the logo and account stay put.
 *
 * `loginFrom` is where Login / Sign up returns to, so a guest comes back to
 * the page they were on. Page titles and Back buttons never go in here —
 * pages put their own inside the page.
 */
export default function EventsHeader({ userName, onSignedOut, loginFrom }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const account = userName ? (
    <UserMenu userName={userName} onSignedOut={onSignedOut} />
  ) : (
    <Link className="cp-btn cp-btn-purple cp-btn-sm" to="/login" state={{ from: loginFrom }}>
      Login / Sign up
    </Link>
  );

  return (
    <header className="evx-header">
      <div className="evx-header-inner">
        <Link className="evx-logo" to="/" aria-label="Clubpass home">
          <img src="/images/cp-logo.png" alt="Clubpass" />
        </Link>

        <div className="evx-nav">
          <nav className={`evx-links${menuOpen ? " is-open" : ""}`}>
            <Link to="/events" onClick={close}>
              Events
            </Link>
            {userName && (
              <Link to="/my-tickets" onClick={close}>
                My Tickets
              </Link>
            )}
          </nav>

          {account}

          <button
            type="button"
            className="evx-nav-toggle"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
