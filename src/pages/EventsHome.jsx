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
import useEventHome from "../hooks/useEventHome.js";
import useIsDesktop from "../hooks/useIsDesktop.js";
import { useTickets } from "../hooks/useTickets.js";
import "../css/event-desktop.css";
import "../css/events-home.css";

/** The shipped copy, shown until Strapi answers and kept if it can't be reached. */
const FALLBACK = {
  hero: {
    title: "Do what you love. Get Rewarded.",
    text: "Discover experiences you'll love, enjoy exclusive perks and earn R Coins along the way.",
    image: "/images/hero_banner.png",
    loggedInImage: "/images/Group%2066.png",
  },
  signup: {
    title: "Get rewarded\nwhen you go out",
    text: "Create a free account and earn 10 R Coins for every $1 spent on tickets.",
    buttonText: "Create Free Account",
    buttonLink: "/signup",
    leftImage: "/images/buy.png",
    rightImage: "/images/coin.png",
  },
  promo: {
    badge: "CLUBPASS MEMBER",
    label: "Get more with Clubpass",
    heading: "Save up to 50% on tickets + earn 3X R Coins",
    text: "Plus ClubPass Home Express and exclusive member perks.",
    price: "$17.90/mth",
    buttonText: "Explore Membership",
  },
};

/** CMS text with its line breaks kept. */
function Lines({ text }) {
  return text.split("\n").map((line, index) => (
    <span key={index}>
      {index > 0 && <br />}
      {line}
    </span>
  ));
}

/** "Do what you love. Get Rewarded." — everything after the first sentence is the teal accent line. */
function splitTitle(title) {
  const [lead, ...rest] = title.split(/(?<=\.)\s+/);
  return { lead, accent: rest.join(" ") };
}

/** The sign-up copy with its "10 R Coins" picked out, as in the design. */
function CoinsHighlight({ text }) {
  const match = text.match(/\d[\d,]*\s+R\s+Coins/);
  if (!match) return text;
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length).replace(/^\s+/, " ");
  return (
    <>
      {before}
      <span>{match[0].replace(/\s+/g, " ")} <Info size={13} /></span>
      {after}
    </>
  );
}

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
  // Arrows only when the row is wider than what fits — a short row has
  // nothing to page through.
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const measure = () => setOverflows(track.scrollWidth > track.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [children]);

  const step = (direction) => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <div className="evh-carousel">
      {overflows && (
        <button type="button" className="evh-arrow evh-arrow--prev" onClick={() => step(-1)} aria-label="Previous">
          <ChevronLeft size={22} />
        </button>
      )}
      <div className="evh-track" ref={trackRef}>
        {children}
      </div>
      {overflows && (
        <button type="button" className="evh-arrow evh-arrow--next" onClick={() => step(1)} aria-label="Next">
          <ChevronRight size={22} />
        </button>
      )}
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

  // The rows and copy come from the event-home single type; the full ticket
  // list is still needed to put a venue and date on the active ticket card.
  const { status, content } = useEventHome(FALLBACK);
  const { hero, signup, promo } = content;
  const { tickets } = useTickets();

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

  // Each row keeps the order picked in Strapi, minus private events, ones
  // already past and ones with nothing on sale. An empty row is dropped.
  const sections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return content.sections
      .map((section) => ({
        ...section,
        events: section.events.filter(
          (event) =>
            event.isPublic &&
            !(event.startsAt && event.startsAt < today) &&
            (event.publicTier || event.memberTier),
        ),
      }))
      .filter((section) => section.events.length);
  }, [content.sections]);

  const heroTitle = splitTitle(hero.title);

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
      {promo.buttonText}
    </button>
  ) : (
    <Link className="evh-promo-cta" to="/signup">
      {promo.buttonText}
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
            {hero.loggedInImage && (
              <img className="evh-mascot" src={hero.loggedInImage} alt="" onError={hideOnError} />
            )}

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
        <section
          className="evh-hero evh-hero--public"
          style={hero.image ? { "--evh-hero-image": `url("${hero.image}")` } : undefined}
        >
          <div className="evh-container">
            <h1 className="evh-hero-title">
              {heroTitle.lead}
              {heroTitle.accent && (
                <>
                  <br />
                  <span>{heroTitle.accent}</span>
                </>
              )}
            </h1>
            {hero.text && <p className="evh-hero-text">{hero.text}</p>}
          </div>
        </section>
      )}

      <main className="evh-body">
        {status === "loading" && note("Loading events…")}
        {status === "error" && note("Events couldn't be loaded right now. Please try again shortly.")}
        {status === "ready" && !sections.length && note("No upcoming events yet.")}

        {sections.map((section) => (
          <section key={section.id} className="evh-section">
            <div className="evh-container evh-section-head">
              <h2>{section.title}</h2>
              {section.seeAllText && (
                <Link className="evh-see-all" to="/event-list">
                  {section.seeAllText}
                </Link>
              )}
            </div>

            {/* An event with no public tier is members-only and gets the exclusive card. */}
            <Carousel>
              {section.events.map((event) =>
                event.publicTier ? (
                  <EventCard key={event.id} event={event} view={view} />
                ) : (
                  <ExclusiveCard key={event.id} event={event} />
                ),
              )}
            </Carousel>
          </section>
        ))}

        {view === "public" && (
          <section className="evh-container">
            <div className="evh-signup">
              {signup.leftImage && (
                <img className="evh-signup-drink" src={signup.leftImage} alt="" aria-hidden="true" onError={hideOnError} />
              )}
              <div className="evh-signup-copy">
                <h2>
                  <Lines text={signup.title} />
                </h2>
                <p>
                  <CoinsHighlight text={signup.text} />
                </p>
                <Link className="evh-signup-cta" to={signup.buttonLink || "/signup"}>
                  {signup.buttonText}
                </Link>
              </div>
              {signup.rightImage && (
                <img className="evh-signup-coins" src={signup.rightImage} alt="" aria-hidden="true" onError={hideOnError} />
              )}
            </div>
          </section>
        )}

        {view !== "member" && (
          <section className="evh-container">
            <div className="evh-promo">
              {promo.badge && <span className="evh-promo-tag">{promo.badge}</span>}
              <div className="evh-promo-copy">
                {promo.label && <p className="evh-promo-label">{promo.label}</p>}
                <h2>
                  <Lines text={promo.heading} />
                </h2>
                {promo.text && <p className="evh-promo-text">{promo.text}</p>}
                <div className="evh-promo-row">
                  {promo.price && <span className="evh-promo-price">{promo.price}</span>}
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
