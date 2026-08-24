import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Minus,
  Plus,
  ChevronDown,
  ChevronRight,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import "../css/clubpass.css";
import "../css/clubpass-new.css";

const APP_LINK = "https://rewardland.onelink.me/EwIe/start";
const SITE = "https://www.rewardland.sg";
const IMG = "/images/cpn";

/* =========================================================
   HERO SLIDER
========================================================= */

const HERO_SLIDES = [
  {
    image: `${IMG}/cp-one-banner.png`,
    title: "The night is yours.",
    accent: "The ride home is ours.",
    text: "Singapore's first late-night coach membership. Scheduled departures from the club district straight to the East — for less than one surge-hour ride.",
  },
  {
    image: `${IMG}/clubpass-hero.png`,
    title: "Your night starts here.",
    accent: "We'll get you home.",
    text: "Enjoy the night without worrying about surge fares or finding a ride home after the last train.",
  },
  {
    image: `${IMG}/cp-one-banner.png`,
    title: "Stay out late.",
    accent: "Ride home easy.",
    text: "Scheduled late-night coaches from the club district straight to the East. Fixed price. No surge.",
  },
];

const VOTE_ROUTES = [
  { key: "west", name: "West Route", count: 18, progress: 64 },
  { key: "north", name: "North Route", count: 26, progress: 48 },
];

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Route & schedule", href: "#routes" },
  { label: "Membership", href: "#membership" },
  { label: "FAQ", href: "#faq" },
];

const WITHOUT_CLUBPASS = [
  "Surge fares that spike after midnight",
  "Long ride queues at closing time",
  "Last train gone before the night ends",
];

const WITH_CLUBPASS = [
  "One fixed price all month — S$19.90",
  "A scheduled coach waiting on the loop",
  "Drop-off minutes from your MRT",
];

const STEPS = [
  {
    img: "/images/one.png",
    num: "01",
    title: "Open RewardLand",
    text: "Download the app, or open it — if you're in, your account is already there.",
    meta: "30 seconds",
  },
  {
    img: "/images/two.png",
    num: "02",
    title: "Find Clubpass",
    text: "It lives right inside the app, next to your rewards wallet.",
    meta: "One tap",
  },
  {
    img: "/images/three.png",
    num: "03",
    title: "Subscribe",
    text: "Pick your membership and pay securely in-app. Cancel anytime.",
    meta: "S$19.90/month",
  },
  {
    img: "/images/four.png",
    num: "04",
    title: "Ride home",
    text: "Show your boarding QR to the driver, find a seat, ride home.",
    meta: "Every operating night",
  },
];

const PICKUPS = [
  "Marina Bay Sands (Marquee / AVENUE)",
  "CÉ LA VI",
  "Clarke Quay Central",
  "Boat Quay / Headquarters",
  "Zouk / Capital",
];

const DROPOFFS = [
  "Paya Lebar MRT",
  "Bedok MRT",
  "Tampines MRT",
  "Pasir Ris MRT*",
];

const SAFETY_CARDS = [
  {
    icon: <img src="/images/cp-clock.png" />,
    title: "On the dot",
    text: "Departures run on the clock - never “when the bus fills up",
  },
  {
    icon: <img src="/images/cp-flower.png" />,
    title: "Members-only boarding",
    text: "Every rider is QR-verified before stepping on. No strangers, no walk-ons.",
  },
  {
    icon: <img src="/images/cp-card.png" />,
    title: "Licensed operators",
    text: "Full-size, air-conditioned coaches with professional drivers — not ad-hoc rides found at 3am.",
  },
  {
    icon: <img src="/images/rl-icon.png" />,
    title: "Ride with your crew",
    text: "Same coach, seats together — the night ends the way it started.",
  },
];

const MEMBER_BENEFITS = [
  "4 operating nights every month",
  "All city pick-up points on the loop",
  "Express drop-offs across the East",
  "Founder Member status & launch rewards",
];

const FAQS = [
  {
    q: "What is Clubass Home Express?",
    a: "A monthly membership for scheduled late-night coaches: a pick-up loop through the city's nightlife spots, then express drop-offs in the East. Fixed schedule, fixed price — no surge, no waiting for a driver at 3am.",
  },
  {
    q: "Is this safe? Who operates the buses?",
    a: "Rides are run by licensed Singapore coach operators with professional drivers and full-size, air-conditioned vehicles. Every seat is booked to a verified RewardLand member and boarding is QR-verified, so nobody rides who isn't a member.",
  },
  {
    q: "How many rides do I get?",
    a: "Your membership covers four operating nights a month — one night a week, every week. Exact timings and the published departure board live in the RewardLand app.",
  },
  {
    q: "Do I need a new account or app?",
    a: "No. Clubpass sits inside the RewardLand app you already have. If you're an existing user you're signed in automatically — no new account, no second app to download.",
  },
  {
    q: "How does billing and cancellation work?",
    a: "S$19.90 is charged monthly to your payment method in the app and renews automatically. You can cancel in two taps from your membership screen — there's no lock-in and no cancellation fee.",
  },
  {
    q: "My route isn't live yet — what can I do?",
    a: "Register your interest for West, North or South. Each route unlocks once enough neighbours vote for it — one vote per route, five seconds. We'll notify you the moment yours goes live.",
  },
];

const TOP_EDGE =
  "C 130 18 260 0 440 0 C 620 0 760 30 900 38 C 1010 45 1080 46 1180 45 C 1300 43 1400 35 1500 26";

const TOP_EDGE_REVERSED =
  "C 1400 35 1300 43 1180 45 C 1080 46 1010 45 900 38 C 760 30 620 0 440 0 C 260 0 130 18 0 40";

const BOTTOM_EDGE_REVERSED =
  "C 1400 111 1300 119 1180 121 C 1080 122 1010 121 900 114 C 760 106 620 76 440 76 C 260 76 130 94 0 116";

function Wave({ variant }) {
  return (
    <svg
      className={`cpn-wave cpn-wave--${variant}`}
      viewBox="0 0 1500 122"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={`cpnWaveGrad-${variant}`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0%" stopColor="#0d1658" />
          <stop offset="17%" stopColor="#3d2182" />
          <stop offset="33%" stopColor="#712eac" />
          <stop offset="50%" stopColor="#9a54c6" />
          <stop offset="67%" stopColor="#c181da" />
          <stop offset="83%" stopColor="#e6a9ee" />
          <stop offset="100%" stopColor="#f9c6fa" />
        </linearGradient>
      </defs>

      {variant === "cap-bottom" && (
        <path
          className="cpn-wave-cap"
          d={`M 0 0 H 1500 V 26 ${TOP_EDGE_REVERSED} Z`}
        />
      )}

      {variant === "cap-top" && (
        <path
          className="cpn-wave-cap"
          d={`M 0 40 ${TOP_EDGE} L 1500 122 H 0 Z`}
        />
      )}

      {variant !== "cap-top" && (
        <path
          d={`M 0 40 ${TOP_EDGE} L 1500 102 ${BOTTOM_EDGE_REVERSED} Z`}
          fill={`url(#cpnWaveGrad-${variant})`}
        />
      )}
    </svg>
  );
}

/**
 * ClubPass mascot.
 */
function Mascot({ fallback }) {
  return (
    <img
      src="/images/clubpass-mascot.png"
      alt=""
      aria-hidden="true"
      onError={(e) => {
        const img = e.currentTarget;

        if (!img.src.endsWith(fallback)) {
          img.src = fallback;
        }
      }}
    />
  );
}

/** Stylised East Route map used in the routes card. */
function RouteMap() {
  return (
    <div
      className="cp-map"
      role="img"
      aria-label="Map of the East Route pick-up loop and express drop-offs"
    >
      <img src="/images/map.png" />
    </div>
  );
}

export default function ClubPass() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [votedRoutes, setVotedRoutes] = useState([]);

  /* =========================================
     HERO SLIDER STATE
  ========================================= */

  const [activeHero, setActiveHero] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHero((prev) => {
        return (prev + 1) % HERO_SLIDES.length;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentHero = HERO_SLIDES[activeHero];

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const voteRoute = (route) => {
    setVotedRoutes((prev) =>
      prev.includes(route) ? prev : [...prev, route]
    );
  };

  return (
    <div className="clubpass-page cpn-page">
      <title>Clubpass Home Express | RewardLand</title>

      <meta
        name="description"
        content="Singapore's first late-night coach membership. Scheduled departures from the club district straight to the East — S$19.90/month, no surge, cancel anytime."
      />

      {/* ================= Header ================= */}

      <header className="cp-header">
        <div className="cp-container cp-header-inner">
          <a className="cp-brand" href="#top">
            <img src="/images/cp-rw-logo.png" />
          </a>

          <nav className={`cp-nav${menuOpen ? " is-open" : ""}`}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div
            className="d-flex align-items-center"
            style={{ gap: 8 }}
          >
            <a
              className="cp-btn cp-btn-purple cp-btn-sm"
              href={APP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open RewardLand
            </a>

            <button
              className="cp-nav-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          HERO SLIDER
      ===================================================== */}

      <section className="cp-hero" id="top">
        <div
          className="cp-hero-inner"
          style={{
            backgroundImage: `url("${currentHero.image}")`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="cp-overlay"></div>

          <div className="cp-container">
            <div className="cp-hero-copy">
              <span className="cp-tag">
                Clubpass · Home Express by RewardLand
              </span>

              <h1>
                {currentHero.title}
                <br />

                <span className="cp-accent">
                  {currentHero.accent}
                </span>
              </h1>

              <p className="cp-hero-text">
                {currentHero.text}
              </p>

              <a
                className="cp-btn cp-btn-ghost"
                href="#how-it-works"
              >
                See how it works

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </a>

              <div className="cp-hero-actions">
                <a
                  className="cp-btn cp-btn-white"
                  href={APP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe — S$19.90/month
                </a>
              </div>
            </div>
          </div>

          {/* ================= Slider Dots ================= */}

          <div className="cp-hero-slider-dots">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`cp-hero-dot ${
                  activeHero === index ? "active" : ""
                }`}
                onClick={() => setActiveHero(index)}
                aria-label={`Go to hero slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= Why ClubPass ================= */}

      <section className="cp-section why-section">
        <div className="cp-container">
          <div className="cp-why-head cp-center">
            <p className="cp-eyebrow">why clubpass?</p>

            <h2 className="cp-h2">
              Getting home after 2am shouldn't be the hardest
              part of the night.
            </h2>
          </div>

          <div className="cp-compare">
            <div className="cp-card-plain">
              <p className="cp-card-label">
                Tonight, without Clubpass
              </p>

              <ul className="cp-list">
                {WITHOUT_CLUBPASS.map((item) => (
                  <li key={item}>
                    <span className="cp-ico cp-ico-x">
                      <X size={14} strokeWidth={3} />
                    </span>

                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cp-card-dark">
              <p className="cp-card-label">
                Tonight, with Clubpass
              </p>

              <ul className="cp-list">
                {WITH_CLUBPASS.map((item) => (
                  <li key={item}>
                    <span className="cp-ico cp-ico-check">
                      <Check size={14} strokeWidth={3} />
                    </span>

                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="cp-container">
        <div className="cp-split-head">
          <div className="dj-image">
            <img
              className="cpn-dj"
              alt=""
              aria-hidden="true"
              src="/images/dj-decks.png"
            />
          </div>
        </div>
      </div>

      <div className="cp-gradient">
        {/* ================= How it works ================= */}

        <section
          className="cp-section"
          id="how-it-works"
          style={{ paddingTop: 0 }}
        >
          <div className="cp-container">
            <div className="cp-split-head">
              <div className="cp-work-text">
                <p className="cp-eyebrow">How it works</p>

                <h2 className="cp-h2">
                  From dance floor to doorstep
                </h2>

                <p className="cp-note">
                  Already a RewardLand user? You're signed in
                  automatically — no new account, no new app.
                </p>
              </div>
            </div>

            <div className="cp-steps">
              {STEPS.map((step) => (
                <div className="cp-step" key={step.num}>
                  <div className="cp-step-num">
                    <img
                      src={step.img}
                      alt={step.title}
                    />
                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.text}</p>

                  <span className="cp-step-meta">
                    {step.meta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= Routes ================= */}

        <section
          className="cpn-section cpn-routes"
          id="routes"
        >
          <div className="cpn-container">
            <h5 className="island-text">
              East is live today, West, North and South unlock as
              neighbours register interest - one vote per route,
              five seconds.
            </h5>
          </div>

          <img
            className="cpn-island"
            src={`${IMG}/island.png`}
            alt=""
            aria-hidden="true"
          />

          <div className="cpn-container">
            <h5 className="island-text-mobile">
              East is live today, West, North and South unlock as
              neighbours register interest - one vote per route,
              five seconds.
            </h5>

            <div className="cpn-route-head">
              <h3>East Route</h3>
              <span className="cpn-live">Live Now</span>
            </div>

            <div className="cpn-stops">
              <div className="cpn-stops-col">
                <h4>Pick-up Loop - City</h4>

                <ul>
                  {PICKUPS.map((stop) => (
                    <li key={stop}>
                      <span className="cpn-ring" />
                      {stop}
                    </li>
                  ))}
                </ul>
              </div>

              <span
                className="cpn-stops-arrow"
                aria-hidden="true"
              >
                <img src="/images/cp-arrow.svg" />
              </span>

              <div className="cpn-stops-col">
                <h4>Express Drop-off - East</h4>

                <ul>
                  {DROPOFFS.map((stop) => (
                    <li key={stop}>
                      <span className="cpn-ring" />
                      {stop}
                    </li>
                  ))}
                </ul>

                <p className="cpn-stops-note">
                  *Subject to demand.
                  <br />
                  Full timings in the app
                </p>
              </div>
            </div>

            <div className="cpn-map-wrap">
              <img
                className="cpn-squiggle"
                src={`${IMG}/squiggle.png`}
                alt=""
                aria-hidden="true"
              />

              <div className="cpn-map">
                <img src="/images/cp-route-map.svg" />
              </div>

              <img
                className="cpn-squiggle-bottom"
                src={`${IMG}/squiggle-bottom.png`}
                alt=""
                aria-hidden="true"
              />
            </div>

            <div className="cpn-route-grid">
              {VOTE_ROUTES.map((route) => (
                <div
                  className="cpn-route-card"
                  key={route.key}
                >
                  <h4>{route.name}</h4>

                  <div className="cpn-route-count">
                    {route.count}
                  </div>

                  <small>more members needed</small>

                  <div className="cpn-progress">
                    <span
                      style={{
                        width: `${route.progress}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="cpn-btn cpn-btn--outline"
                    onClick={() => voteRoute(route.key)}
                    disabled={votedRoutes.includes(route.key)}
                  >
                    {votedRoutes.includes(route.key)
                      ? "Vote counted"
                      : "I want this route"}
                  </button>
                </div>
              ))}

              <div className="cpn-route-card">
                <h4>South Route</h4>

                <p className="cpn-route-soon">
                  Coming soon - be the first to
                  <br />
                  know when voting opens.
                </p>

                <button
                  type="button"
                  className="cpn-btn cpn-btn--outline"
                  onClick={() => voteRoute("south")}
                  disabled={votedRoutes.includes("south")}
                >
                  {votedRoutes.includes("south")
                    ? "You're on the list"
                    : "I want this route"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= Schedule & safety ================= */}

        <section className="cpn-safety">
          <div className="cpn-container cpn-safety-inner">
            <p className="cpn-kicker cpn-kicker--light">
              Schedule &amp; Safety
            </p>

            <div className="cpn-safety-head">
              <h2 className="cpn-h2 cpn-h2--light">
                Planned like transit.
                <br />
                Protected like a members' club.
              </h2>

              <p>
                Fixed nights, fixed stops, verified riders.
                <br />
                Nothing about your ride home is left to chance.
              </p>
            </div>

            <div className="cpn-safe-grid">
              <div className="cpn-safety-top">
                <div className="cpn-nights">
                  <img src={`${IMG}/num-4.png`} alt="4" />

                  <div>
                    <h3>
                      nights a month - one night a week, every
                      week
                    </h3>

                    <hr />

                    <p>
                      Departures are fixed and published ahead of
                      time; exact timings live in the app. Your
                      price never changes - no surge, ever.
                    </p>
                  </div>
                </div>
              </div>

              <div className="cpn-safety-grid">
                {SAFETY_CARDS.map((card) => (
                  <div
                    className="cpn-safety-card"
                    key={card.title}
                  >
                    {card.icon && (
                      <span className="cpn-safety-icon">
                        {card.icon}
                      </span>
                    )}

                    <h3>{card.title}</h3>

                    <p>{card.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ================= Membership ================= */}

      <section
        className="cpn-section cpn-membership"
        id="membership"
      >
        <div className="cpn-container cpn-membership-grid">
          <div className="cpn-membership-copy">
            <p className="cpn-kicker cpn-kicker--orange">
              Membership
            </p>

            <h2 className="cpn-h2">
              One simple membership.
              <br />
              No surge maths.
            </h2>

            <p className="cpn-membership-lead">
              A single monthly subscription inside the RewardLand
              app. It renews automatically, and you can cancel in
              two taps - no lock-in, no hidden fees.
            </p>

            <ul className="cpn-benefits">
              {MEMBER_BENEFITS.map((benefit) => (
                <li key={benefit}>
                  <span className="cpn-mark cpn-mark--check">
                    <Check size={13} strokeWidth={3} />
                  </span>

                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="cpn-ticket-wrap">
            <img
              className="cpn-starburst"
              src={`${IMG}/starburst.png`}
              alt=""
              aria-hidden="true"
            />

            <img
              className="cpn-skater"
              src={`${IMG}/skater.png`}
              alt=""
              aria-hidden="true"
            />

            <span className="cpn-spark cpn-spark--1" />
            <span className="cpn-spark cpn-spark--2" />

            <div className="cpn-ticket">
              <div className="cpn-ticket-head">
                Club pass - Home Express
              </div>

              <div className="cpn-ticket-body">
                <div className="cpn-price">
                  SGD $19.90<span>/mth</span>
                </div>

                <p className="cpn-ticket-note">
                  Founder launch price - First 150 members only.
                  Locked in for as long as you stay subscribed.
                </p>
              </div>

              <div className="cpn-ticket-rip" />

              <div className="cpn-ticket-foot">
                <dl className="cpn-ticket-stats">
                  <div>
                    <dt>Status</dt>
                    <dd>Founder</dd>
                  </div>

                  <div>
                    <dt>Rides</dt>
                    <dd>4 nights/mth</dd>
                  </div>

                  <div>
                    <dt>Boarding</dt>
                    <dd>QR in app</dd>
                  </div>
                </dl>

                <a
                  className="cpn-btn cpn-btn--white"
                  href={APP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe to RewardLand
                </a>

                <p className="cpn-ticket-fine">
                  Auto-renews monthly.
                  Cancel anytime in the app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}

      <section className="cpn-section cpn-faq" id="faq">
        <div className="cpn-container">
          <p className="cpn-kicker cpn-kicker--orange">
            FAQ
          </p>

          <div className="cpn-faq-copy">
            <h2 className="cpn-h2">
              Good questions,
              straight answers
            </h2>

            <p>
              Anything we missed?
              <br />
              Full details live in the RewardLand app.
            </p>
          </div>

          <div className="cpn-faq-grid">
            <div className="cp-faq-image">
              <img src="/images/cp-bus.png" />
            </div>

            <div className="cpn-acc">
              {FAQS.map((faq, index) => (
                <div
                  className={`cpn-acc-item${
                    openFaq === index ? " is-open" : ""
                  }`}
                  key={faq.q}
                >
                  <button
                    type="button"
                    aria-expanded={openFaq === index}
                    onClick={() =>
                      setOpenFaq((prev) =>
                        prev === index ? null : index
                      )
                    }
                  >
                    <span>{faq.q}</span>

                    {openFaq === index ? (
                      <Minus size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>

                  <div className="cpn-acc-panel">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Final CTA ================= */}

      <section className="cpn-cta-wrap">
        <div className="cpn-container">
          <div className="cpn-cta">
            <img
              className="cpn-cta-bus"
              src={`${IMG}/music-girl.png`}
              alt=""
              aria-hidden="true"
            />

            <h2>Be one of the first 150.</h2>

            <p>
              Founder pricing ends when the seats are gone. Lock
              in SGD$19.90/mth and be part of Clubpass from night
              one.
            </p>

            <a
              className="cpn-btn cpn-btn--dark"
              href={APP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign Up Now
            </a>
          </div>
        </div>
      </section>

      {/* ================= Footer ================= */}

      <footer className="cp-footer">
        <div className="cp-container cp-footer-inner">
          <div className="cp-brand">
            <img src="/images//cp-rw-logo.png" />
            {/* <span className="cp-brand-mark">R</span>

            <span className="cp-brand-name">
              reward<label className="cl-color">land</label>
            </span>

            <span className="cp-footer-tag">
              Shop. Earn. Redeem. Repeat.
            </span> */}
          </div>

          <div className="cp-footer-links">
            <a href={SITE}>About RewardLand</a>
            <a href={`${SITE}/terms-and-conditions`}>
              Terms of Use
            </a>
            <a href={`${SITE}/privacy-policy`}>
              Privacy Policy
            </a>
            <a href={`${SITE}/contact`}>
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}