import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Minus, Plus } from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import { isPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import { getEventById } from "../data/events.js";
import "../css/event-tickets.css";

// $ per R Coin at the base (non-member) rate — a paid member's active
// multiplier is 3x this, and a guest is shown that same 3x figure as a
// "here's what you'd earn" hook to create a free account.
const COIN_RATE = 1;
const MEMBER_COIN_MULTIPLIER = 3;

/**
 * Every tier is priced off the event's own "from" price so each event gets a
 * sensible, internally consistent ladder without a second data file to keep
 * in sync: Member < Early Bird < Standard < Door.
 *
 * Which tiers show, and whether each is buyable, depends on the viewer:
 *  - Member Price is always listed, but locked behind an "Unlock Member
 *    Price" nudge until `paid` is true.
 *  - Standard Price only appears for a signed-in member who hasn't paid —
 *    it's the fallback once Early Bird is gone, and there's no equivalent
 *    guest nudge (a guest still has Early Bird to buy).
 *  - Door Price is always listed but always "upcoming" — door sales don't
 *    open until the event's sale calendar reaches it.
 */
function buildTiers(event, { paid, loggedIn }) {
  const base = event.priceFrom;
  const loggedInNotPaid = loggedIn && !paid;

  const tiers = [
    {
      id: "member",
      label: "Member Price",
      price: base - 20,
      status: paid ? "active" : "locked",
      note: paid
        ? null
        : "Sign up for membership to unlock this price. No quantity limits for this benefit.",
    },
    {
      id: "early-bird",
      label: "Early Bird",
      price: base - 10,
      salePeriod: "Sep 20 – Sep 27",
      stockLeft: 10,
      status: loggedInNotPaid ? "soldOut" : "active",
    },
  ];

  if (loggedInNotPaid) {
    tiers.push({
      id: "standard",
      label: "Standard Price",
      price: base,
      salePeriod: "Sep 27 – Oct 24",
      status: "active",
    });
  }

  tiers.push({
    id: "door",
    label: "Door Price",
    price: base + 15,
    salePeriod: "Oct 25 – Oct 31",
    status: "upcoming",
  });

  return tiers;
}

/**
 * Reached from EventDetails.jsx's "Get Tickets Now". Public, like that page —
 * a guest can still browse and pick tickets, they just don't get the Member
 * Price tier or the real R Coins rate until they sign up.
 */
export default function EventTickets() {
  const { id } = useParams();
  const event = getEventById(id);

  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  const [clubpassUser, setClubpassUser] = useState(null);
  useEffect(() => {
    if (!session?.user?.username) return;
    let cancelled = false;
    resolveClubpassUser(session.user).then(
      (user) => { if (!cancelled) setClubpassUser(user); },
      () => { if (!cancelled) setClubpassUser(null); },
    );
    return () => { cancelled = true; };
  }, [session]);

  const paid = isPaid(clubpassUser);
  const tiers = useMemo(
    () => (event ? buildTiers(event, { paid, loggedIn: Boolean(userName) }) : []),
    [event, paid, userName],
  );

  const [quantities, setQuantities] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const adjust = (tier, delta) => {
    if (tier.status !== "active") return;
    setQuantities((prev) => {
      const next = Math.max(0, (prev[tier.id] ?? 0) + delta);
      const capped = tier.stockLeft != null ? Math.min(next, tier.stockLeft) : next;
      return { ...prev, [tier.id]: capped };
    });
  };

  const total = tiers.reduce((sum, tier) => sum + tier.price * (quantities[tier.id] ?? 0), 0);
  const coinMultiplier = paid ? MEMBER_COIN_MULTIPLIER : userName ? 1 : MEMBER_COIN_MULTIPLIER;
  const coins = Math.round(total * COIN_RATE * coinMultiplier);

  if (!event) {
    return (
      <div className="evt-page">
        <header className="evt-header">
          <Link className="evt-back" to="/" aria-label="Back">
            <ArrowLeft size={18} />
          </Link>
          <h1>Select Tickets</h1>
        </header>
        <div className="evt-body">
          <p className="evt-not-found">
            We couldn't find that event. <Link to="/">Back to ClubPass</Link>
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="evt-page">
        <header className="evt-header">
          <Link className="evt-back" to={`/events/${event.id}`} aria-label="Back">
            <ArrowLeft size={18} />
          </Link>
          <h1>Select Tickets</h1>
        </header>
        <div className="evt-body">
          <div className="evt-confirm">
            <span className="evt-confirm-tick">✓</span>
            <h2>Tickets reserved</h2>
            <p>
              {total > 0
                ? `Your tickets for ${event.title} are set — total S$${total}.`
                : `You're all set for ${event.title}.`}
            </p>
            <Link className="evt-cta" to={`/events/${event.id}`}>
              Back to event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="evt-page">
      <header className="evt-header">
        <Link className="evt-back" to={`/events/${event.id}`} aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <h1>Select Tickets</h1>

        {userName ? (
          <span className="evt-hi">Hi, {userName}</span>
        ) : (
          <Link
            className="evt-login-btn"
            to="/login"
            state={{ from: `/events/${event.id}/tickets` }}
          >
            Login / Signup
          </Link>
        )}
      </header>

      <div className="evt-body">
        {tiers.map((tier) => {
          const qty = quantities[tier.id] ?? 0;
          const locked = tier.status === "locked";
          const soldOut = tier.status === "soldOut";
          const upcoming = tier.status === "upcoming";
          const active = tier.status === "active";

          return (
            <div key={tier.id} className={`evt-card evt-card--${tier.status}`}>
              <div className="evt-card-top">
                <div className="evt-card-info">
                  <div className="evt-card-label">{tier.label}</div>
                  <div className="evt-card-sub">Single entry ticket</div>
                </div>

                <div className="evt-card-price">${tier.price}</div>

                <div className="evt-stepper">
                  <button
                    type="button"
                    onClick={() => adjust(tier, -1)}
                    disabled={!active || qty <= 0}
                    aria-label={`Decrease ${tier.label} quantity`}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={() => adjust(tier, 1)}
                    disabled={!active || (tier.stockLeft != null && qty >= tier.stockLeft)}
                    aria-label={`Increase ${tier.label} quantity`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {tier.note && <p className="evt-card-note">{tier.note}</p>}

              {locked && (
                <Link className="evt-unlock-btn" to="/clubpass-app">
                  Unlock Member Price
                </Link>
              )}

              {(soldOut || upcoming || active) && (tier.salePeriod || soldOut) && (
                <div className="evt-card-bottom">
                  {soldOut && <span className="evt-tag evt-tag--sold">Sold out</span>}
                  {active && tier.stockLeft != null && (
                    <span className="evt-tag evt-tag--stock">Only {tier.stockLeft} left</span>
                  )}
                  {tier.salePeriod && (
                    <div className="evt-sale-period">
                      <span>Sale period</span>
                      <b>{tier.salePeriod}</b>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="evt-coins">
          {paid ? (
            <>
              <b>+{coins} R Coins pending</b>
              <span>Credited upon checkout with your active 3x member multiplier.</span>
            </>
          ) : userName ? (
            <>
              <b>+{coins} R Coins awaiting from this purchase</b>
              <span>Credited upon checkout.</span>
            </>
          ) : (
            <>
              <b>+{coins} R Coins awaiting</b>
              <span>Create free account to start earning R coins.</span>
              <Link to="/signup">Sign up for free</Link>
            </>
          )}
        </div>
      </div>

      <footer className="evt-footer">
        <div className="evt-total">
          <span>Total</span>
          <b>${total}</b>
        </div>

        <button
          type="button"
          className="evt-cta"
          disabled={total <= 0}
          onClick={() => setSubmitted(true)}
        >
          Checkout
        </button>
      </footer>
    </div>
  );
}
