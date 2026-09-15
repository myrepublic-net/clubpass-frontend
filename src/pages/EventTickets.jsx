import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  Info,
  Minus,
  Plus,
  Smartphone,
  Wallet,
} from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import { isPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import { getEventById } from "../data/events.js";
import useMembershipCheckout, { SIMULATE } from "../hooks/useMembershipCheckout.js";
import usePaypalSdk from "../hooks/usePaypalSdk.js";
import "../css/event-tickets.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// R Coins earn back a percentage of the spend — 3% on a paid Clubpass
// membership, 1% on a free account — and a coin is a thousandth, so the
// percentage is scaled by 1000 to get the coin count. $265 at 3% is $7.95,
// which is 7,950 coins.
const MEMBER_COIN_RATE = 0.03;
const FREE_COIN_RATE = 0.01;
const COINS_PER_DOLLAR = 1000;

// The same figure the subscribe flow charges, so the upsell can't quote a
// price the checkout then contradicts.
const MEMBERSHIP_PRICE = import.meta.env.VITE_CLUBPASS_PRICE ?? "19.90";

/** What the membership buys, as pitched on the upsell screen. */
const MEMBERSHIP_PERKS = [
  ["Up to 50% off all tickets", "Save on standard entrance prices always"],
  ["3× R Coins Multiplier", "Earn and redeem points at 170+ partner brands"],
  ["Home Express Shuttle", "Safe rides home from prime nightlife districts"],
  ["Free Entry Days", "Complimentary admission to selected partner events"],
];

/** The payment options, in the order the checkout design lists them. */
const PAYMENT_METHODS = [
  { id: "card", label: "Card payment", icon: CreditCard },
  { id: "googlepay", label: "Google Pay", icon: Wallet },
  { id: "applepay", label: "Apple Pay", icon: Smartphone },
];

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
      maxQty: 1,
      note: paid
        ? "Limited to 1 ticket per member for this event."
        : "Sign up for membership to unlock this price. Limited to 1 ticket per member.",
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

/** #GC-1234567 for a guest booking, #CP-1234567 for a signed-in one. */
function bookingReference(loggedIn) {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return `#${loggedIn ? "CP" : "GC"}-${String(n % 10_000_000).padStart(7, "0")}`;
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
  // select -> guestEmail (signed out only) -> checkout -> payment ->
  // processing -> confirmed. A signed-in buyer skips guestEmail.
  const [step, setStep] = useState("select");
  const [guestEmail, setGuestEmail] = useState("");
  const [method, setMethod] = useState("card");
  const [booking, setBooking] = useState(null);
  const [payError, setPayError] = useState("");
  const emailValid = EMAIL_PATTERN.test(guestEmail.trim());

  // Only spin the SDK up on the payment step — it's a script load plus an
  // eligibility round trip, and nothing before that step needs it.
  const { eligible, status: sdkStatus } = usePaypalSdk(step === "payment");

  // A tier can cap quantity for two different reasons: `maxQty` is a per-
  // member purchase limit (Member Price: 1 per event), `stockLeft` is how
  // many are left to sell (Early Bird). Whichever applies to a tier wins.
  const capFor = (tier) => tier.maxQty ?? tier.stockLeft ?? Infinity;

  const adjust = (tier, delta) => {
    if (tier.status !== "active") return;
    setQuantities((prev) => {
      const next = Math.max(0, (prev[tier.id] ?? 0) + delta);
      return { ...prev, [tier.id]: Math.min(next, capFor(tier)) };
    });
  };

  const lines = tiers
    .map((tier) => ({ tier, qty: quantities[tier.id] ?? 0 }))
    .filter((line) => line.qty > 0);  

  const ticketCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.tier.price * line.qty, 0);

  // What the same tickets would have cost at the event's standard price —
  // only shown when the buyer is actually paying less than that.   
  const standardTotal = event ? ticketCount * event.priceFrom : 0;

  // A guest earns nothing until they have an account, so the figure they're
  // shown is what a free account would have earned — that's what the "create
  // free account" line next to it is offering them.
  const coinRate = paid ? MEMBER_COIN_RATE : FREE_COIN_RATE;
  const coins = Math.round(total * coinRate * COINS_PER_DOLLAR);

  // Subscribing happens in the middle of picking tickets, so the membership
  // checkout runs here and hands back the updated record — `paid` flips off
  // that, which is what unlocks the Member Price row behind this screen.
  const [justSubscribed, setJustSubscribed] = useState(false);

  const membership = useMembershipCheckout({
    active: step === "membershipPayment",
    userName,
    user: clubpassUser,
    profile: session?.user ?? null,
    setUser: setClubpassUser,
    onPaid: (updated) => {
      setClubpassUser(updated);
      setJustSubscribed(true);

      setQuantities((prev) => {
        // Standard Price isn't offered to members, so anything sitting in it
        // would vanish from the basket along with the row. Move it to Early
        // Bird — it survives the switch and costs them less — rather than
        // quietly dropping tickets they'd already chosen.
        const carried = prev.standard ?? 0;
        const earlyBirdCap = tiers.find((tier) => tier.id === "early-bird")?.stockLeft ?? Infinity;

        return {
          ...prev,
          // They came here to buy the member-priced ticket — put it in the basket.
          member: Math.max(prev.member ?? 0, 1),
          standard: 0,
          "early-bird": Math.min((prev["early-bird"] ?? 0) + carried, earlyBirdCap),
        };
      });

      setStep("select");
    },
  });

  /** First renewal is a month after joining. */
  const renewalDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
  }, []);

  /**
   * Takes the payment and returns the booking.
   *
   * The PayPal Lambda we already use can't charge this yet: its create-order
   * action prices every order at CLUBPASS_PRICE and vaults it against a
   * member's userName, because it exists to sell the membership. Ticket
   * orders need an amount and no membership, so this approves locally until
   * that Lambda grows a ticket-order action — this is the one place to swap.
   */
  const payForTickets = async () => {
    console.warn(
      "[tickets] No ticket-order endpoint yet — approving locally. " +
        "The subscribe Lambda prices orders at CLUBPASS_PRICE and requires a member userName.",
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { reference: bookingReference(Boolean(userName)) };
  };

  const pay = async () => {
    setPayError("");
    setStep("processing");

    try {
      const result = await payForTickets();
      setBooking(result);
      setStep("confirmed");
    } catch (error) {
      console.error("Ticket payment failed", error);
      setPayError(error?.message ?? "That payment didn't go through. Please try again.");
      setStep("payment");
    }
  };

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

  /** The header's right-hand slot: who you are, or a way to become someone. */
  const identity = userName ? (
    <span className="evt-hi">Hi, {userName}</span>
  ) : (
    <Link
      className="evt-login-btn"
      to="/login"
      state={{ from: `/events/${event.id}/tickets` }}
    >
      Login / Signup
    </Link>
  );

  const eventCard = (
    <div className="evt-event-card">
      <img src={event.images[0]} alt="" />
      <div>
        <b>{event.title}</b>
        <span>
          {event.venue} &bull; {event.date}
        </span>
      </div>
    </div>
  );

  if (step === "guestEmail") {
    return (
      <div className="evt-page">
        <header className="evt-header">
          <button
            type="button"
            className="evt-back"
            onClick={() => setStep("select")}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1>Guest Checkout</h1>
          {identity}
        </header>

        <div className="evt-body">
          <h2 className="evt-guest-title">Your email</h2>
          <p className="evt-guest-sub">
            Please enter the email address where you would like to receive your booking
            confirmation and digital entry tickets.
          </p>

          <label className="evt-field-label" htmlFor="guest-email">
            Email address
          </label>
          <input
            id="guest-email"
            className="evt-input"
            type="email"
            inputMode="email"
            placeholder="Enter your email"
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
          />

          <div className="evt-info-box">
            <Info size={16} />
            <span>
              We'll send your ticket to this email address. No password or registration required.
            </span>
          </div>

          <button
            type="button"
            className="evt-cta evt-cta--block"
            disabled={!emailValid}
            onClick={() => setStep("checkout")}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === "membership") {
    return (
      <div className="evt-page">
        <header className="evt-header">
          <button
            type="button"
            className="evt-back"
            onClick={() => setStep("select")}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1>Clubpass membership</h1>
          {identity}
        </header>

        <div className="evt-body">
          <h2 className="evt-upsell-title">Get instant ticket savings</h2>
          <p className="evt-upsell-sub">
            Get Member pricing on this ticket and unlock exclusive perks across all partner clubs.
          </p>

          <div className="evt-perks">
            <div className="evt-perks-head">Exclusive perks</div>

            {MEMBERSHIP_PERKS.map(([title, detail]) => (
              <div key={title} className="evt-perk">
                <b>{title}</b>
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <div className="evt-plan">
            <div className="evt-plan-top">
              <div>
                <b>Monthly Membership</b>
                <span>Full premium access</span>
              </div>
              <div className="evt-plan-price">${MEMBERSHIP_PRICE}/mo</div>
            </div>

            <div className="evt-plan-renews">
              <Calendar size={15} />
              <span>Renews automatically on {renewalDate}</span>
            </div>
          </div>
        </div>

        <footer className="evt-footer evt-footer--single">
          <button
            type="button"
            className="evt-cta evt-cta--block"
            onClick={() => setStep("membershipPayment")}
          >
            Subscribe Now
          </button>
        </footer>
      </div>
    );
  }

  if (step === "membershipPayment") {
    const { flow, method: chosen, setMethod, sdkStatus, sdkError, eligible } = membership;
    const canUse = (id) => sdkStatus !== "ready" || Boolean(eligible?.[id]);
    const busy = flow.status === "processing";

    return (
      <div className="evt-page">
        <header className="evt-header">
          <button
            type="button"
            className="evt-back"
            onClick={() => setStep("membership")}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1>Select Payment Method</h1>
          {identity}
        </header>

        <div className="evt-body">
          <h2 className="evt-section-title">Choose Payment</h2>
          <p className="evt-charge-note">
            Charge: ${membership.price} for 1st Month Membership
          </p>

          {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => {
            const selected = chosen === id;
            const available = canUse(id);

            return (
              <button
                key={id}
                type="button"
                className={`evt-method${selected ? " is-selected" : ""}`}
                disabled={!available || busy}
                onClick={() => setMethod(id)}
              >
                {selected && (
                  <span className="evt-method-icon">
                    <Icon size={16} />
                  </span>
                )}
                <span className="evt-method-label">{label}</span>
                {!available && <span className="evt-method-hint">Not available here</span>}
                <span className={`evt-radio${selected ? " is-on" : ""}`} />
              </button>
            );
          })}

          {/* PayPal's hosted card fields mount here. Kept in the tree while
              card is the choice — remounting mid-entry tears the iframes down. */}
          <div className={`evt-card-fields${chosen === "card" ? "" : " is-hidden"}`}>
            <div ref={membership.cardHostRef} />
          </div>

          {sdkStatus === "loading" && <p className="evt-pay-note">Loading secure checkout…</p>}
          {sdkStatus === "error" && <p className="evt-pay-error">{sdkError}</p>}
          {busy && <p className="evt-pay-note">Activating your membership…</p>}

          {flow.status === "error" && (
            <p className="evt-pay-error">
              {flow.message}
              {flow.detail && <small>{flow.detail}</small>}
            </p>
          )}

          {flow.status === "saveFailed" && (
            <p className="evt-pay-error">
              Your payment went through, but we couldn't activate the membership automatically.
              Contact support with reference <b>{flow.transactionId}</b>.
            </p>
          )}

          {SIMULATE && (
            <button
              type="button"
              className="evt-sim-btn"
              onClick={membership.simulatePayment}
              disabled={busy}
            >
              Simulate successful payment
            </button>
          )}
        </div>

        <footer className="evt-footer evt-footer--single">
          <button
            type="button"
            className="evt-cta evt-cta--block"
            disabled={!chosen || busy}
            onClick={() => membership.start(chosen)}
          >
            Continue
          </button>
        </footer>
      </div>
    );
  }

  if (step === "checkout") {
    return (
      <div className="evt-page">
        <header className="evt-header">
          <button
            type="button"
            className="evt-back"
            onClick={() => setStep(userName ? "select" : "guestEmail")}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1>Checkout</h1>
          {identity}
        </header>

        <div className="evt-body">
          {eventCard}

          <div className="evt-summary">
            <div className="evt-summary-head">Ticket summary</div>

            <div className="evt-summary-row">
              <div>
                <b>
                  {ticketCount} {ticketCount === 1 ? "Ticket" : "Tickets"}
                </b>
                <span className="evt-summary-lines">
                  {lines.map((line) => `${line.qty}× ${line.tier.label}`).join(" • ")}
                </span>
              </div>

              <div className="evt-summary-price">
                {standardTotal > total && <s>${standardTotal.toFixed(2)}</s>}
                <b>${total.toFixed(2)}</b>
              </div>
            </div>
          </div>

          <div className="evt-totals">
            <div className="evt-totals-row">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="evt-totals-row evt-totals-row--grand">
              <span>Order Total</span>
              <b>${total.toFixed(2)}</b>
            </div>
          </div>
        </div>

        <footer className="evt-footer evt-footer--single">
          <button
            type="button"
            className="evt-cta evt-cta--block"
            onClick={() => setStep("payment")}
          >
            Continue
          </button>
        </footer>
      </div>
    );
  }

  if (step === "payment") {
    // Until PayPal answers we don't know what this browser can use, so nothing
    // is greyed out yet — a method only goes disabled once it says no.
    const canUse = (id) => sdkStatus !== "ready" || Boolean(eligible?.[id]);

    return (
      <div className="evt-page">
        <header className="evt-header">
          <button
            type="button"
            className="evt-back"
            onClick={() => setStep("checkout")}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1>Payment Method</h1>
          {identity}
        </header>

        <div className="evt-body">
          <div className="evt-due">
            <span>Due Today:</span>
            <b>${total.toFixed(2)}</b>
          </div>

          <h2 className="evt-section-title">Select Payment Option</h2>

          {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => {
            const selected = method === id;
            const available = canUse(id);

            return (
              <button
                key={id}
                type="button"
                className={`evt-method${selected ? " is-selected" : ""}`}
                disabled={!available}
                onClick={() => setMethod(id)}
              >
                {selected && (
                  <span className="evt-method-icon">
                    <Icon size={16} />
                  </span>
                )}
                <span className="evt-method-label">{label}</span>
                {!available && <span className="evt-method-hint">Not available here</span>}
                <span className={`evt-radio${selected ? " is-on" : ""}`} />
              </button>
            );
          })}

          {payError && <p className="evt-pay-error">{payError}</p>}
        </div>

        <footer className="evt-footer evt-footer--single">
          <button type="button" className="evt-cta evt-cta--block" onClick={pay}>
            Pay Now (${total})
          </button>
        </footer>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="evt-page">
        <div className="evt-processing">
          <span className="evt-spinner" role="status" aria-label="Processing payment" />
          <h2>Processing Payment…</h2>
          <p>
            Please don't close this screen or tap the back button. We are securely validating
            your booking.
          </p>
        </div>
      </div>
    );
  }

  if (step === "confirmed") {
    const holder = userName ?? "Guest User";
    const ticketType = lines.length === 1 ? lines[0].tier.label : "Mixed tickets";
    // A guest earns nothing — that's what the create-an-account card is for.
    const earned = userName ? coins : 0;

    return (
      <div className="evt-page">
        <div className="evt-body evt-body--confirm">
          <div className="evt-confirm-head">
            <span className="evt-confirm-tick">✓</span>
            <h1>Order Confirmed</h1>
            <p>
              Your booking is confirmed. Your ticket will be sent to your email within 24 hours.
            </p>
          </div>

          <div className="evt-booking">
            <b className="evt-booking-title">{event.title}</b>
            <span className="evt-booking-when">
              {event.date} &bull; {event.time}
            </span>
            <span className="evt-booking-venue">{event.venue}</span>

            <dl className="evt-booking-facts">
              <div>
                <dt>Date &amp; Time</dt>
                <dd>
                  {event.date} &bull; {event.time}
                </dd>
              </div>
              <div>
                <dt>Ticket Type</dt>
                <dd>{ticketType}</dd>
              </div>
              <div>
                <dt>Holder Name</dt>
                <dd>{holder}</dd>
              </div>
              <div>
                <dt>Booking Reference</dt>
                <dd>{booking?.reference}</dd>
              </div>
              <div>
                <dt>Ticket Status</dt>
                <dd>Preparing your ticket</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{guestEmail ? `Email to ${guestEmail}` : "Email within 24 hours"}</dd>
              </div>
            </dl>

            <div className="evt-booking-coins">
              <span>R Coins Earned</span>
              <span className="evt-coin-pill">{earned} R Coins ›</span>
            </div>
          </div>

          {!userName && (
            <div className="evt-reward-card">
              <b>Get rewarded for your purchase</b>
              <span>Create your free account to earn R Coins on your next purchase</span>
              <Link className="evt-cta evt-cta--block" to="/signup">
                Create free account
              </Link>
            </div>
          )}

          <Link className="evt-back-link" to={`/events/${event.id}`}>
            Back to event
          </Link>
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
        {identity}
      </header>

      <div className="evt-body">
        {justSubscribed && (
          <div className="evt-member-banner">
            <CheckCircle2 size={18} />
            <span>You're getting member prices</span>
          </div>
        )}

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
                    disabled={!active || qty >= capFor(tier)}
                    aria-label={`Increase ${tier.label} quantity`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {tier.note && <p className="evt-card-note">{tier.note}</p>}

              {/* Signed in, the pitch happens right here; signed out there's
                  no account to put a membership on, so that still starts at
                  the membership page's own sign-in gate. */}
              {locked && (userName ? (
                <button
                  type="button"
                  className="evt-unlock-btn"
                  onClick={() => setStep("membership")}
                >
                  Unlock Member Price
                </button>
              ) : (
                <Link className="evt-unlock-btn" to="/clubpass-app">
                  Unlock Member Price
                </Link>
              ))}

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
              <span>Credited upon checkout at your active 3% member rate.</span>
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
          onClick={() => setStep(userName ? "checkout" : "guestEmail")}
        >
          Checkout
        </button>
      </footer>
    </div>
  );
}
