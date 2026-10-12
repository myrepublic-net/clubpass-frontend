import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { ChevronRight, Search, Ticket } from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import { cardKeyOf, fetchMyTickets } from "../api/subscribe.js";
import { fetchTickets } from "../api/tickets.js";
import MyTicketsHeader from "../components/MyTicketsHeader.jsx";
import useIsDesktop from "../hooks/useIsDesktop.js";
import "../css/my-tickets.css";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];


/** "SAT, 16 SEP • 10 PM" — minutes only when there are some. */
function whenLabel(date) {
  if (!date) return "";
  const hour = date.getHours() % 12 || 12;
  const minutes = date.getMinutes() ? `:${String(date.getMinutes()).padStart(2, "0")}` : "";
  const period = date.getHours() < 12 ? "AM" : "PM";
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} • ${hour}${minutes} ${period}`;
}

/**
 * One card per event: a member's orders for the same event are combined, and
 * the event itself (image, venue, current date) comes from the events list.
 * An event no longer listed still shows, from what the order recorded.
 */
function toCards(orders, events) {
  const byId = new Map(events.map((event) => [event.id, event]));
  const cards = new Map();

  for (const order of orders) {
    const key = cardKeyOf(order);
    const event = order.ticketId ? byId.get(order.ticketId) : null;

    if (!cards.has(key)) {
      const startsAt = event?.startsAt ?? (order.eventDate ? new Date(order.eventDate) : null);
      cards.set(key, {
        key,
        title: event?.title || order.eventTitle || "Event",
        venue: event?.venue ?? "",
        image: event?.images?.[0] ?? null,
        startsAt,
        counts: new Map(),
        search: [],
      });
    }

    const card = cards.get(key);
    for (const { label, quantity } of order.items ?? []) {
      if (!(quantity > 0)) continue;
      const name = label || "Ticket";
      card.counts.set(name, (card.counts.get(name) ?? 0) + quantity);
    }
    card.search.push(order.bookingReference, ...(order.tickets ?? []).map((t) => t.ticketNumber));
  }

  return [...cards.values()].map((card) => ({
    ...card,
    summary: [...card.counts].map(([label, quantity]) => `${quantity} x ${label}`).join(", "),
    search: [card.title, card.venue, ...card.search].filter(Boolean).join(" ").toLowerCase(),
  }));
}

/** Opens the event's tickets, one QR pass each, on Ticket Detail. */
function TicketCard({ card }) {
  return (
    <Link className="mtk-card" to={`/my-tickets/${encodeURIComponent(card.key)}`}>
      <div className="mtk-card-image">{card.image && <img src={card.image} alt="" />}</div>
      <div className="mtk-card-body">
        {card.startsAt && <p className="mtk-card-when">{whenLabel(card.startsAt)}</p>}
        <h2 className="mtk-card-title">{card.title}</h2>
        {card.venue && <p className="mtk-card-venue">{card.venue}</p>}
        <div className="mtk-card-foot">
          <Ticket size={20} className="mtk-card-icon" />
          <span>{card.summary || "Tickets"}</span>
          <ChevronRight size={22} className="mtk-card-chevron" />
        </div>
      </div>
    </Link>
  );
}

/** Reached from the account menu in any header. */
export default function MyTickets() {
  const isDesktop = useIsDesktop();
  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  const [state, setState] = useState({ status: "loading", cards: [], message: "" });
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!userName) return;

    let cancelled = false;
    Promise.all([
      fetchMyTickets({ userName, accessToken: session?.token }),
      // Only for images and venues — the tickets still list without it.
      fetchTickets().catch(() => []),
    ]).then(
      ([orders, events]) => {
        if (!cancelled) setState({ status: "ready", cards: toCards(orders, events), message: "" });
      },
      (error) => {
        console.error("My Tickets failed to load", error);
        if (!cancelled) {
          setState({ status: "error", cards: [], message: error.message || "Couldn't load your tickets." });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userName, session]);

  const { upcoming, past } = useMemo(() => {
    // An event dated before today is past; tonight's stays upcoming all day.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = (card) => card.startsAt && card.startsAt < today;
    const time = (card) => card.startsAt?.getTime() ?? Infinity;

    return {
      // Soonest first; past ones most recent first.
      upcoming: state.cards.filter((card) => !isPast(card)).sort((a, b) => time(a) - time(b)),
      past: state.cards.filter(isPast).sort((a, b) => time(b) - time(a)),
    };
  }, [state.cards]);

  // Nothing to show without an account.
  if (!userName) return <Navigate to="/login" state={{ from: "/my-tickets" }} replace />;

  const needle = query.trim().toLowerCase();
  const list = (tab === "upcoming" ? upcoming : past).filter((card) => !needle || card.search.includes(needle));

  let content;
  if (state.status === "loading") {
    content = <p className="mtk-note">Loading your tickets…</p>;
  } else if (state.status === "error") {
    content = <p className="mtk-note is-error">{state.message}</p>;
  } else if (!list.length) {
    content = (
      <p className="mtk-note">
        {needle
          ? "No tickets match your search."
          : tab === "upcoming"
            ? "You have no upcoming tickets."
            : "You have no past tickets."}
      </p>
    );
  } else {
    content = (
      <div className="mtk-grid">
        {list.map((card) => (
          <TicketCard key={card.key} card={card} />
        ))}
      </div>
    );
  }

  return (
    <div className="mtk-page">
      <title>Clubpass | My Tickets</title>
      <MyTicketsHeader title="My Tickets" userName={userName} />

      <main className="mtk-main">
        {isDesktop && <h1 className="mtk-title">My Tickets</h1>}

        <div className="mtk-toolbar">
          <div className="mtk-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "upcoming"}
              className={`mtk-tab${tab === "upcoming" ? " is-active" : ""}`}
              onClick={() => setTab("upcoming")}
            >
              Upcoming{state.status === "ready" ? ` (${upcoming.length})` : ""}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "past"}
              className={`mtk-tab${tab === "past" ? " is-active" : ""}`}
              onClick={() => setTab("past")}
            >
              Past Tickets
            </button>
          </div>

          <label className="mtk-search">
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search your tickets"
            />
          </label>
        </div>

        {content}
      </main>
    </div>
  );
}
