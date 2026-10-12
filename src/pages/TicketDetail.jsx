import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router";

import { readMemberSession } from "../api/auth.js";
import { isPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import { cardKeyOf, fetchMyTickets } from "../api/subscribe.js";
import { fetchTickets } from "../api/tickets.js";
import MyTicketsHeader, { BackLink } from "../components/MyTicketsHeader.jsx";
import useIsDesktop from "../hooks/useIsDesktop.js";
import "../css/my-tickets.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sat, 16 Sep" */
function dayLabel(date) {
  return date ? `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}` : "";
}

// Anything but "valid" is called out on the pass, so a used or refunded
// ticket isn't mistaken for one that still gets in.
const STATUS_LABELS = { used: "USED", cancelled: "CANCELLED", refunded: "REFUNDED" };

/**
 * One pass per issued ticket, across every order the member has for this
 * event. The event (title, date, venue, tier descriptions) comes from the
 * events list when it's still there, else from what the order recorded.
 */
function toPasses(orders, events, key) {
  const mine = orders.filter((order) => cardKeyOf(order) === key);
  if (!mine.length) return null;

  const event = mine[0].ticketId ? events.find((item) => item.id === mine[0].ticketId) : null;
  const startsAt = event?.startsAt ?? (mine[0].eventDate ? new Date(mine[0].eventDate) : null);
  // By tier id, else by name: editing and republishing an event in Strapi
  // gives every tier a new id, so older tickets only match on the name.
  const tiers = event?.tiers ?? [];
  const nameOf = (label) => (label ?? "").trim().toLowerCase();
  const descriptionOf = (ticket) =>
    (
      tiers.find((tier) => tier.id === ticket.tier) ??
      tiers.find((tier) => nameOf(tier.label) === nameOf(ticket.tierLabel))
    )?.description ?? "";

  return {
    title: event?.title || mine[0].eventTitle || "Event",
    subtitle: [dayLabel(startsAt), event?.venue].filter(Boolean).join(" • "),
    passes: mine.flatMap((order) =>
      (order.tickets ?? []).map((ticket) => ({
        ...ticket,
        bookingReference: order.bookingReference,
        description: descriptionOf(ticket).trim(),
      })),
    ),
  };
}

function Pass({ event, pass, userName, membership }) {
  const status = STATUS_LABELS[pass.status];

  const rows = [
    ["Ticket Type", pass.tierLabel || "Ticket"],
    pass.description && ["Description", pass.description],
    ["Username", userName],
    ["Membership", <span className="tkd-badge" key="membership">{membership}</span>],
    ["Booking ID", pass.bookingReference],
    ["Ticket No", pass.ticketNumber],
    pass.rCoins > 0 && ["R Coins earned", `+${pass.rCoins.toLocaleString()}`],
  ].filter(Boolean);

  return (
    <article className={`tkd-pass${status ? " is-void" : ""}`}>
      <div className="tkd-head">
        <p className="tkd-label">Ticket QR Code</p>
        <h2 className="tkd-title">{event.title}</h2>
        {event.subtitle && <p className="tkd-sub">{event.subtitle}</p>}
      </div>

      <div className="tkd-qr">
        {/* The QR isn't shown yet: an empty tile holds its place. */}
        <div className="tkd-qr-box" aria-hidden="true" />
        {status && <span className="tkd-status">{status}</span>}
      </div>

      <dl className="tkd-rows">
        {rows.map(([label, value]) => (
          <div className="tkd-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/** A My Tickets card opened: every ticket for that event, one pass under the other. */
export default function TicketDetail() {
  const { key } = useParams();
  const isDesktop = useIsDesktop();
  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  const [state, setState] = useState({ status: "loading", event: null, message: "" });
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userName) return;

    let cancelled = false;
    Promise.all([
      fetchMyTickets({ userName, accessToken: session?.token }),
      // Only for the venue, the current date and tier descriptions.
      fetchTickets().catch(() => []),
    ]).then(
      ([orders, events]) => {
        if (!cancelled) setState({ status: "ready", event: toPasses(orders, events, key), message: "" });
      },
      (error) => {
        console.error("Ticket Detail failed to load", error);
        if (!cancelled) {
          setState({ status: "error", event: null, message: error.message || "Couldn't load your tickets." });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userName, session, key]);

  // For the Membership row: the member's plan as it stands now.
  useEffect(() => {
    if (!session?.user?.username) return;

    let cancelled = false;
    resolveClubpassUser(session.user).then(
      (record) => {
        if (!cancelled) setUser(record);
      },
      (error) => console.error("ClubPass user lookup failed", error),
    );
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Nothing to show without an account.
  if (!userName) return <Navigate to="/login" state={{ from: `/my-tickets/${key}` }} replace />;

  const membership = isPaid(user) ? "CLUBPASS MEMBER" : "CLUBPASS FREE";
  const event = state.event;

  let content;
  if (state.status === "loading") {
    content = <p className="mtk-note tkd-note">Loading your tickets…</p>;
  } else if (state.status === "error") {
    content = <p className="mtk-note tkd-note is-error">{state.message}</p>;
  } else if (!event?.passes.length) {
    content = <p className="mtk-note tkd-note">We couldn&apos;t find these tickets.</p>;
  } else {
    content = (
      <div className="tkd-list">
        {event.passes.map((pass) => (
          <Pass key={pass.ticketNumber} event={event} pass={pass} userName={userName} membership={membership} />
        ))}
      </div>
    );
  }

  return (
    <div className="mtk-page tkd-page">
      <title>Clubpass | Ticket Detail</title>
      <MyTicketsHeader userName={userName} backTo="/my-tickets" />

      <main className="mtk-main">
        {isDesktop && <BackLink to="/my-tickets" />}
        {content}
      </main>
    </div>
  );
}
