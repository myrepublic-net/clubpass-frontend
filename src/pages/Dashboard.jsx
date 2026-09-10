import { Award, Bell, ChevronRight, Home, Info, Lock, Star, Ticket, User } from "lucide-react";
import { Link } from "react-router";

import { isPaid } from "../api/clubpassUser.js";
import { useClubpassUser } from "../components/clubpassUserContext.js";
import "../css/dashboard.css";

/**
 * Placeholder content — there's no R Coins balance, ticket, or events API
 * yet, so this page is about the logged-in home layout and free/member
 * gating, not live data. Swap these for real API calls once those exist;
 * nothing below this point should need to change shape when that happens.
 */
const MOCK_R_COINS = 320;

const MOCK_TICKET = { venue: "Zouk Singapore", date: "Sat, 16 Sep" };

const WHATS_ON = [
  {
    id: "marquee-dj-snake",
    date: "FRI 15 SEP",
    image: "/images/dj-decks.png",
    coinsFree: 600,
    coinsMember: 1350,
    title: "Marquee Friday: DJ Snake",
    venue: "Marquee Singapore",
    priceFree: 60,
    priceMember: 45,
    save: 30,
  },
  {
    id: "zouk-neon-night",
    date: "SAT 16 SEP",
    image: "/images/cpn/discoball.png",
    coinsFree: 300,
    coinsMember: 700,
    title: "Zouk: Neon Nights",
    venue: "Zouk Singapore",
    priceFree: 30,
    priceMember: 18,
    save: 30,
  },
];

const MEMBER_EXCLUSIVE = [
  {
    id: "sunset-sessions",
    date: "SUN 17 SEP",
    image: "/images/island.png",
    title: "Sunset Sessions",
    venue: "Ce La Vi Singapore",
  },
  {
    id: "industry-night",
    date: "WED 20 SEP",
    image: "/images/cpn/speaker.png",
    title: "Industry Night",
    venue: "Marquee Singapore",
  },
];

/**
 * The member's home once logged in — separate from /clubpass-app (the
 * Home Express bus sales/dashboard page), which stays exactly as it was.
 * Free vs member here is driven by the same isPaid(user) check that page
 * already uses.
 */
export default function Dashboard() {
  const { user, userName } = useClubpassUser();
  const paid = isPaid(user);

  return (
    <div className="dsh-page">
      <title>Clubpass | Home</title>

      <header className="dsh-header">
        <img className="dsh-logo" src="/images/cp-rw-logo.png" alt="Clubpass by RewardLand" />

        <nav className="dsh-nav-desktop" aria-label="Primary">
          <span className="dsh-nav-link is-active">Home</span>
          <span className="dsh-nav-link">Events</span>
          <span className="dsh-nav-link">My Tickets</span>
          <Link className="dsh-nav-link" to="/clubpass-app">
            Membership
          </Link>
        </nav>

        <button type="button" className="dsh-bell" aria-label="Notifications">
          <Bell size={20} />
        </button>
      </header>

      <div className="dsh-hero">
        <div className="dsh-welcome-row">
          <div>
            <p className="dsh-welcome-label">Welcome back,</p>
            <h1 className="dsh-welcome-name">{userName || "there"}</h1>
          </div>

          <div className={`dsh-coins${paid ? " is-member" : ""}`}>
            <div className="dsh-coins-top">
              <div className="dsh-coins-row">
                <Award size={16} />
                <b>{MOCK_R_COINS.toLocaleString()} R Coins</b>
              </div>
              <span className="dsh-coins-badge">{paid ? "MEMBER" : "FREE"}</span>
            </div>
            <span className="dsh-coins-tap">Tap to redeem</span>
          </div>
        </div>

        <button type="button" className="dsh-ticket-card">
          <Ticket size={20} />
          <span className="dsh-ticket-text">
            <b>You have 1 active ticket</b>
            <small>
              {MOCK_TICKET.venue} • {MOCK_TICKET.date}
            </small>
          </span>
          <ChevronRight size={18} className="dsh-ticket-chevron" />
        </button>
      </div>

      <main className="dsh-body">
        <section className="dsh-section">
          <div className="dsh-section-head">
            <h2>What&apos;s On</h2>
            <span className="dsh-see-all">See All</span>
          </div>

          <div className="dsh-card-row">
            {WHATS_ON.map((event) => (
              <article className="dsh-event-card" key={event.id}>
                <div className="dsh-event-image">
                  <img src={event.image} alt="" />
                  <span className="dsh-event-date">{event.date}</span>
                </div>

                <div className="dsh-event-body">
                  <p className="dsh-event-coins">
                    Earn up to {(paid ? event.coinsMember : event.coinsFree).toLocaleString()} R
                    Coins <Info size={12} />
                  </p>
                  <h3 className="dsh-event-title">{event.title}</h3>
                  <p className="dsh-event-venue">{event.venue}</p>

                  {paid ? (
                    <>
                      <span className="dsh-event-tier is-member">
                        <Star size={11} /> MEMBER
                      </span>
                      <p className="dsh-event-price">
                        From ${event.priceMember} <s>${event.priceFree}</s>
                      </p>
                      <p className="dsh-event-save">Save {event.save}%</p>
                    </>
                  ) : (
                    <>
                      <span className="dsh-event-tier">STANDARD</span>
                      <p className="dsh-event-price">From ${event.priceFree}</p>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dsh-section">
          <div className="dsh-section-head">
            <h2>Member Exclusive</h2>
            <span className="dsh-see-all">See All</span>
          </div>

          <div className="dsh-card-row">
            {MEMBER_EXCLUSIVE.map((event) => (
              <article className="dsh-event-card" key={event.id}>
                <div className="dsh-event-image">
                  <img src={event.image} alt="" />
                  <span className="dsh-event-date">{event.date}</span>
                  {!paid && (
                    <span className="dsh-event-lock" aria-hidden="true">
                      <Lock size={13} />
                    </span>
                  )}
                </div>

                <div className="dsh-event-body">
                  <h3 className="dsh-event-title">{event.title}</h3>
                  <p className="dsh-event-venue">{event.venue}</p>
                  <p className="dsh-event-free">FREE ENTRY</p>
                  <p className="dsh-event-note">Members only</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {!paid && (
          <section className="dsh-promo">
            <p className="dsh-promo-label">Get more with Clubpass</p>
            <h3>Save up to 30% on tickets + earn 3X R Coins</h3>
            <p className="dsh-promo-text">Plus ClubPass Home Express and exclusive member perks.</p>
            <div className="dsh-promo-row">
              <span className="dsh-promo-price">$19.90/month</span>
              <Link className="dsh-promo-cta" to="/clubpass-app">
                Explore Membership
              </Link>
            </div>
          </section>
        )}
      </main>

      <nav className="dsh-tabbar" aria-label="Primary">
        <span className="dsh-tab is-active">
          <Home size={20} />
          Home
        </span>
        <span className="dsh-tab">
          <Ticket size={20} />
          Events
        </span>
        <span className="dsh-tab">
          <Award size={20} />
          My Tickets
        </span>
        <Link className="dsh-tab" to="/clubpass-app">
          <User size={20} />
          Membership
        </Link>
      </nav>
    </div>
  );
}
