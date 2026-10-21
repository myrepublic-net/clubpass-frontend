import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Info, Star, Ticket } from "lucide-react";

import { fetchPointsBalance, readMemberSession } from "../api/auth.js";
import { isPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import { cardKeyOf, fetchMyTickets } from "../api/subscribe.js";
import RCoinsSheet from "../components/RCoinsSheet.jsx";
import SubscribeModal from "../components/SubscribeModal.jsx";
import UserMenu from "../components/UserMenu.jsx";
import { ClubpassUserContext } from "../components/clubpassUserContext.js";
import useIsDesktop from "../hooks/useIsDesktop.js";
import { useTickets } from "../hooks/useTickets.js";
import "../css/event-desktop.css";
import "../css/events-home.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sat, 16 Sep" for the active ticket card. */
function shortDate(date) {
  if (!date) return "";
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Hides an artwork that hasn't been uploaded yet rather than showing a broken image. */
const hideOnError = (event) => {
  event.currentTarget.style.display = "none";
};

/** The silver R coin, with its reflection fading out underneath. */
function SilverCoin({ className }) {
  return (
    <span className={`evh-silver ${className}`} aria-hidden="true">
      <img src="/images/silver_coin_big.png" alt="" />
      <img className="evh-silver-reflection" src="/images/silver_coin_big.png" alt="" />
    </span>
  );
}

/**
 * A row of cards. Desktop pages through it with the side arrows; mobile
 * swipes it, with the next card peeking in.
 */
function Carousel({ children }) {
  const trackRef = useRef(null);

  const step = (direction) => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <div className="evh-carousel">
      <button type="button" className="evh-arrow evh-arrow--prev" onClick={() => step(-1)} aria-label="Previous">
        <ChevronLeft size={22} />
      </button>
      <div className="evh-track" ref={trackRef}>
        {children}
      </div>
      <button type="button" className="evh-arrow evh-arrow--next" onClick={() => step(1)} aria-label="Next">
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

/**
 * A What's On card. Desktop always quotes both prices; on mobile a member
 * sees only their price against the standard one, and a free account only
 * the standard one.
 */
function EventCard({ event, view }) {
  return (
    <Link className={`evh-card is-${view}`} to={`/events/${event.id}`}>
      <div className="evh-card-image">
        {event.images[0] && <img src={event.images[0]} alt="" />}
        {event.dateBadge && <span className="evh-card-date">{event.dateBadge}</span>}
      </div>

      <div className="evh-card-body">
        {event.memberCoins != null && (
          <p className="evh-card-coins">
            Earn up to {event.memberCoins.toLocaleString()} R Coins
            <Info size={11} />
          </p>
        )}

        <h3 className="evh-card-title">{event.title}</h3>
        {event.venue && <p className="evh-card-venue">{event.venue}</p>}

        <div className="evh-prices">
          {event.publicTier && (
            <div className="evh-price evh-price--standard">
              <span>{event.publicTier.label}</span>
              <b>From ${event.publicTier.price}</b>
            </div>
          )}

          {event.memberTier && (
            <div className="evh-price evh-price--member">
              <span>
                Member <Star size={10} fill="currentColor" />
              </span>
              <b>
                From ${event.memberTier.price}
                {event.publicTier && <s>${event.publicTier.price}</s>}
              </b>
              {event.memberSaving > 0 && <small>Save {event.memberSaving}%</small>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/** A Member Exclusive card: events with only member tiers. */
function ExclusiveCard({ event }) {
  const price = event.memberTier?.price;

  return (
    <Link className="evh-card" to={`/events/${event.id}`}>
      <div className="evh-card-image">
        {event.images[0] && <img src={event.images[0]} alt="" />}
        {event.dateBadge && <span className="evh-card-date">{event.dateBadge}</span>}
      </div>

      <div className="evh-card-body">
        <h3 className="evh-card-title">{event.title}</h3>
        {event.venue && <p className="evh-card-venue">{event.venue}</p>}
        <p className="evh-card-free">{price ? `From $${price}` : "FREE ENTRY"}</p>
        <p className="evh-card-note">Members only</p>
      </div>
    </Link>
  );
}

/**
 * The home page's "See more events" box lands here: What's On and Member
 * Exclusive rows, under a hero that changes with who's looking — a guest
 * gets the pitch, a signed-in account their R Coins and active ticket.
 */
export default function EventsHome() {
  const isDesktop = useIsDesktop();
  const [session, setSession] = useState(() => readMemberSession());
  const userName = session?.user?.username ?? null;

  const [clubpassUser, setClubpassUser] = useState(null);
  const [coins, setCoins] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [coinsSheetOpen, setCoinsSheetOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const { tickets, status } = useTickets();

  useEffect(() => {
    if (!userName) {
      setClubpassUser(null);
      setCoins(null);
      setMyTickets([]);
      return undefined;
    }

    let cancelled = false;
    resolveClubpassUser(session.user).then(
      (user) => { if (!cancelled) setClubpassUser(user); },
      (error) => { console.error("ClubPass user lookup failed", error); },
    );
    fetchPointsBalance().then(
      (balance) => { if (!cancelled) setCoins(balance); },
      (error) => { console.error("R Coin balance failed to load", error); },
    );
    fetchMyTickets({ userName, accessToken: session?.token }).then(
      (orders) => { if (!cancelled) setMyTickets(orders); },
      (error) => { console.error("My Tickets failed to load", error); },
    );
    return () => { cancelled = true; };
  }, [userName, session]);

  const paid = isPaid(clubpassUser);
  const view = !userName ? "public" : paid ? "member" : "free";

  const subscribeUser = useMemo(
    () => ({ userName: userName ?? "", user: clubpassUser, profile: session?.user ?? null, setUser: setClubpassUser }),
    [userName, clubpassUser, session],
  );

  // Upcoming public events only, soonest first. An event with no public
  // tier is members-only, so it's under Member Exclusive instead.
  const { whatsOn, exclusive } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const time = (event) => event.startsAt?.getTime() ?? Infinity;

    const upcoming = tickets
      .filter((event) => event.isPublic && !(event.startsAt && event.startsAt < today))
      .sort((a, b) => time(a) - time(b));

    return {
      whatsOn: upcoming.filter((event) => event.publicTier),
      exclusive: upcoming.filter((event) => !event.publicTier && event.memberTier),
    };
  }, [tickets]);

  // One booking per card on My Tickets, so the count matches what's there.
  // Only bookings for events still ahead count as active.
  const active = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byId = new Map(tickets.map((event) => [event.id, event]));
    const seen = new Map();

    for (const order of myTickets) {
      const key = cardKeyOf(order);
      if (seen.has(key)) continue;
      const event = order.ticketId ? byId.get(order.ticketId) : null;
      const startsAt = event?.startsAt ?? (order.eventDate ? new Date(order.eventDate) : null);
      if (startsAt && startsAt < today) continue;
      seen.set(key, { key, venue: event?.venue || order.eventTitle || "", startsAt });
    }

    return [...seen.values()].sort(
      (a, b) => (a.startsAt?.getTime() ?? Infinity) - (b.startsAt?.getTime() ?? Infinity),
    );
  }, [myTickets, tickets]);

  const next = active[0];

  const account = userName ? (
    <UserMenu userName={userName} onSignedOut={() => setSession(null)} />
  ) : (
    <Link className="cp-btn cp-btn-purple cp-btn-sm" to="/login" state={{ from: "/events" }}>
      Login / Sign up
    </Link>
  );

  const membershipCta = userName ? (
    <button type="button" className="evh-promo-cta" onClick={() => setSubscribeOpen(true)}>
      Explore Membership
    </button>
  ) : (
    <Link className="evh-promo-cta" to="/signup">
      Explore Membership
    </Link>
  );

  const note = (text) => <p className="evh-note">{text}</p>;

  return (
    <div className={`evh-page is-${view}`}>
      <title>Clubpass | Events</title>

      <header className="evx-header">
        <div className="evx-header-inner">
          <Link className="evx-logo" to="/" aria-label="Clubpass home">
            <img src="/images/cp-logo.png" alt="Clubpass" />
          </Link>
          <nav className="evx-nav">
            {isDesktop && <Link to="/events">Events</Link>}
            {isDesktop && userName && <Link to="/my-tickets">My Tickets</Link>}
            {account}
          </nav>
        </div>
      </header>

      {userName ? (
        <section className="evh-hero evh-hero--user">
          <div className="evh-container evh-hero-grid">
            <img className="evh-mascot" src="/images/event-profile.png" alt="" onError={hideOnError} />

            <div className="evh-hero-panel">
              <div className="evh-welcome">
                <div>
                  <p className="evh-welcome-label">Welcome back,</p>
                  <h1 className="evh-welcome-name">{userName}</h1>
                </div>

                <button
                  type="button"
                  className={`evh-coins is-${view}`}
                  onClick={() => setCoinsSheetOpen(true)}
                >
                  {paid ? (
                    <>
                      <span className="evh-coins-badge">MEMBER</span>
                      <SilverCoin className="evh-coins-silver" />
                    </>
                  ) : (
                    <span className="evh-coins-badge">FREE</span>
                  )}
                  <span className="evh-coins-row">
                    {!paid && (
                      <span className="evh-coins-icon" aria-hidden="true">
                        <img src="/images/coin.png" alt="" />
                      </span>
                    )}
                    <b>{coins != null ? coins.toLocaleString() : "—"} R Coins</b>
                  </span>
                  <span className="evh-coins-tap">Tap to redeem</span>
                </button>
              </div>

              {next && (
                <Link
                  className="evh-ticket"
                  to={active.length === 1 ? `/my-tickets/${encodeURIComponent(next.key)}` : "/my-tickets"}
                >
                  <Ticket size={26} className="evh-ticket-icon" />
                  <span className="evh-ticket-text">
                    <b>
                      You have {active.length} active ticket{active.length === 1 ? "" : "s"}
                    </b>
                    <small>{[next.venue, shortDate(next.startsAt)].filter(Boolean).join(" • ")}</small>
                  </span>
                  <ChevronRight size={18} className="evh-ticket-chevron" />
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="evh-hero evh-hero--public">
          <div className="evh-container">
            <h1 className="evh-hero-title">
              Do what you love.
              <br />
              <span>Get Rewarded.</span>
            </h1>
            <p className="evh-hero-text">
              Discover experiences you&apos;ll love, enjoy exclusive perks and earn R Coins along the way.
            </p>
          </div>
        </section>
      )}

      <main className="evh-body">
        <section className="evh-section">
          <div className="evh-container evh-section-head">
            <h2>What&apos;s On</h2>
            <Link className="evh-see-all" to="/event-list">
              See All
            </Link>
          </div>

          {status === "loading" && note("Loading events…")}
          {status === "error" && note("Events couldn't be loaded right now. Please try again shortly.")}
          {status === "ready" && !whatsOn.length && note("No upcoming events yet.")}
          {whatsOn.length > 0 && (
            <Carousel>
              {whatsOn.map((event) => (
                <EventCard key={event.id} event={event} view={view} />
              ))}
            </Carousel>
          )}
        </section>

        {exclusive.length > 0 && (
          <section className="evh-section">
            <div className="evh-container evh-section-head">
              <h2>Member Exclusive</h2>
              <Link className="evh-see-all" to="/event-list">
                See All
              </Link>
            </div>

            <Carousel>
              {exclusive.map((event) => (
                <ExclusiveCard key={event.id} event={event} />
              ))}
            </Carousel>
          </section>
        )}

        {view === "public" && (
          <section className="evh-container">
            <div className="evh-signup">
              <img className="evh-signup-drink" src="/images/buy.png" alt="" aria-hidden="true" />
              <div className="evh-signup-copy">
                <h2>
                  Get rewarded
                  <br />
                  when you go out
                </h2>
                <p>
                  Create a free account and earn <span>10 R Coins <Info size={13} /></span> for every $1 spent
                  on tickets.
                </p>
                <Link className="evh-signup-cta" to="/signup">
                  Create Free Account
                </Link>
              </div>
              <img className="evh-signup-coins" src="/images/coin.png" alt="" aria-hidden="true" />
            </div>
          </section>
        )}

        {view !== "member" && (
          <section className="evh-container">
            <div className="evh-promo">
              <span className="evh-promo-tag">CLUBPASS MEMBER</span>
              <div className="evh-promo-copy">
                <p className="evh-promo-label">Get more with Clubpass</p>
                <h2>
                  Save up to 50% on tickets
                  <br />+ earn 3X R Coins
                </h2>
                <p className="evh-promo-text">Plus ClubPass Home Express and exclusive member perks.</p>
                <div className="evh-promo-row">
                  <span className="evh-promo-price">$17.90/mth</span>
                  {membershipCta}
                </div>
              </div>
              <SilverCoin className="evh-promo-coin" />
            </div>
          </section>
        )}
      </main>

      <RCoinsSheet open={coinsSheetOpen} onClose={() => setCoinsSheetOpen(false)} />
      <ClubpassUserContext.Provider value={subscribeUser}>
        <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} withUpsell />
      </ClubpassUserContext.Provider>
    </div>
  );
}
