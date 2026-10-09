import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import UserMenu from "./UserMenu.jsx";
import useIsDesktop from "../hooks/useIsDesktop.js";
import "../css/event-desktop.css";
import "../css/my-tickets.css";

/**
 * The header My Tickets and Ticket Detail share. Desktop: the event pages'
 * header, minus a My Tickets link — on desktop it lives in the account menu.
 * Mobile: a blue band with the page title, or with a Back link to `backTo`
 * in its place.
 */
export default function MyTicketsHeader({ title, userName, backTo }) {
  const isDesktop = useIsDesktop();

  return isDesktop ? (
    <header className="evx-header">
      <div className="evx-header-inner">
        <Link className="evx-logo" to="/" aria-label="Clubpass home">
          <img src="/images/cp-logo.png" alt="Clubpass" />
        </Link>
        <nav className="evx-nav">
          <Link to="/#venues">Events</Link>
          <UserMenu userName={userName} />
        </nav>
      </div>
    </header>
  ) : (
    <header className="mtk-header">
      {backTo ? <BackLink to={backTo} /> : <h1>{title}</h1>}
      <UserMenu userName={userName} />
    </header>
  );
}

/** "← Back" — Ticket Detail's way back to My Tickets, on both layouts. */
export function BackLink({ to }) {
  return (
    <Link className="mtk-back" to={to}>
      <ArrowLeft size={20} aria-hidden="true" />
      Back
    </Link>
  );
}
