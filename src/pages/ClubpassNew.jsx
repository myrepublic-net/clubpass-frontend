import { useEffect, useState } from "react";
import { Check, ChevronRight, Clock, Menu, Minus, Plus, UserRound, X } from "lucide-react";

import "../css/clubpass-new.css";

const APP_LINK = "https://rewardland.onelink.me/EwIe/start";
const IMG = "/images/cpn";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Route & Schedule", href: "#routes" },
  { label: "Membership", href: "#membership" },
  { label: "FAQ", href: "#faq" },
];

/* Hero carousel. Slide 1 is the artwork from the design; slides 2 and 3 use
   existing ClubPass banners as placeholders — swap `art` for the real
   creatives when they land. */
const HERO_SLIDES = [
  {
    id: "night",
    art: `${IMG}/hero-art.jpg`,
    alt: "Clubpass party bus rolling through Singapore",
    lines: ["The night is yours."],
    accent: ["The ride home", "is ours."],
    text: "Singapore’s first late-night coach membership. Scheduled departures from the club district straight to the East — for less than one surge-hour ride.",
    cta: "Subscribe $19.90/mth",
  },
  {
    id: "schedule",
    art: "/images/clubpass-hero.png",
    alt: "Clubpass Home Express coach at Marina Bay",
    lines: ["Four nights a month."],
    accent: ["Always on the clock."],
    text: "Departures are fixed and published ahead of time — never “when the bus fills up”. One night a week, every week, at a price that never surges.",
    cta: "See the departure board",
  },
  {
    id: "members",
    art: "/images/cba-banner.jpg",
    alt: "Clubpass members boarding the Home Express",
    lines: ["Members only."],
    accent: ["Verified at the door."],
    text: "Every seat is booked to a verified RewardLand member and boarding is QR-verified. Licensed operators, professional drivers, no walk-ons.",
    cta: "Become a founder member",
  },
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
    num: 1,
    title: "Open RewardLand",
    text: "Download the app, or open it - your account is already there.",
    meta: "30 seconds",
  },
  {
    num: 2,
    title: "Find Clubpass",
    text: "It lives right inside the app, next to your rewards wallet.",
    meta: "One tap",
  },
  {
    num: 3,
    title: "Subscribe",
    text: "Pick your membership and pay securely in-app. Cancel anytime",
    meta: "SGD$19.90/mth",
  },
  {
    num: 4,
    title: "Ride home",
    text: "Show your boarding QR to the driver, find a seat, relax.",
    meta: "Every operating night",
  },
];

const PICKUPS = [
  "Marina Bay Sands (Marquee / Avenue)",
  "CE LA VI",
  "Clarke Quay Central",
  "Boat Quay / Headquarters",
  "Zouk / Capital",
];

const DROPOFFS = ["Paya Lebar MRT", "Bedok MRT", "Tampines MRT", "Pasir Ris MRT*"];

const VOTE_ROUTES = [
  { key: "west", name: "West Route", count: 18, progress: 64 },
  { key: "north", name: "North Route", count: 26, progress: 48 },
];

const SAFETY_CARDS = [
  {
    icon: null,
    title: "Members - only boarding",
    text: "Every rider is QR-verified before stepping on. No strangers, no walk-ins.",
  },
  {
    icon: <UserRound size={26} strokeWidth={1.6} />,
    title: "Licensed operators",
    text: "Full-size, air-conditioned coaches with professional drivers - not ad-hoc rides found at 3am.",
  },
  {
    icon: null,
    title: "Ride with your crew",
    text: "Same coach, seats together - the night ends the way it started.",
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
    q: "What is Clubpass Home Express?",
    a: "A monthly membership for scheduled late-night coaches: a pick-up loop through the city's nightlife spots, then express drop-offs in the East. Fixed schedule, fixed price - no surge, no waiting for a driver at 3am.",
  },
  {
    q: "Is this safe? Who operates the buses?",
    a: "Rides are run by licensed Singapore coach operators with professional drivers and full-size, air-conditioned vehicles. Every seat is booked to a verified RewardLand member and boarding is QR-verified, so nobody rides who isn't a member.",
  },
  {
    q: "How many rides do I get?",
    a: "Your membership covers four operating nights a month - one night a week, every week. Exact timings and the published departure board live in the RewardLand app.",
  },
  {
    q: "Do I need a new account or app?",
    a: "No. Clubpass sits inside the RewardLand app you already have. If you're an existing user you're signed in automatically - no new account, no second app to download.",
  },
  {
    q: "How does billing and cancellation work?",
    a: "SGD$19.90 is charged monthly to your payment method in the app and renews automatically. You can cancel in two taps from your membership screen - there's no lock-in and no cancellation fee.",
  },
  {
    q: "My route isn't live yet - what can I do?",
    a: "Register your interest for West, North or South. Each route unlocks once enough neighbours vote for it - one vote per route, five seconds. We'll notify you the moment yours goes live.",
  },
];

/* ---------------------------------------------------------------------------
   Wave divider. One shape, three uses:
     "hero"       ribbon only (the hero artwork shows through above it)
     "cap-bottom" white cap above + ribbon below (top of the dark section)
     "cap-top"    white cap under a wavy edge (bottom of the dark section)
   --------------------------------------------------------------------------- */
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
        <linearGradient id={`cpnWaveGrad-${variant}`} x1="0" y1="0" x2="1" y2="0">
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
        <path className="cpn-wave-cap" d={`M 0 0 H 1500 V 26 ${TOP_EDGE_REVERSED} Z`} />
      )}
      {variant === "cap-top" && (
        <path className="cpn-wave-cap" d={`M 0 40 ${TOP_EDGE} L 1500 122 H 0 Z`} />
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

export default function ClubpassNew() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [votedRoutes, setVotedRoutes] = useState([]);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setSlide((prev) => (prev + 1) % HERO_SLIDES.length),
      7000,
    );
    return () => clearInterval(id);
  }, [slide]);

  const hero = HERO_SLIDES[slide];

  const voteRoute = (route) =>
    setVotedRoutes((prev) => (prev.includes(route) ? prev : [...prev, route]));

  return (
    <div className="cpn-page">
      {/* React 19 hoists these into <head>. */}
      <title>Clubpass Home Express | RewardLand</title>
      <meta
        name="description"
        content="Singapore's first late-night coach membership. Scheduled departures from the club district straight to the East — SGD$19.90/month, no surge, cancel anytime."
      />

      {/* ================= Header ================= */}
      <header className="cpn-header">
        <div className="cpn-header-inner">
          <a className="cpn-logo" href="#top">
            <img src={`${IMG}/logo.jpg`} alt="Clubpass by RewardLand" />
          </a>

          <nav className={`cpn-nav${menuOpen ? " is-open" : ""}`}>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="cpn-header-actions">
            <a
              className="cpn-btn cpn-btn--orange"
              href={APP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Reward Land
            </a>
            <button
              type="button"
              className="cpn-nav-toggle"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ================= Hero ================= */}
      <section className="cpn-hero" id="top">
        <div className="cpn-container cpn-hero-inner">
          <div className="cpn-hero-copy" key={hero.id}>
            <h1>
              {hero.lines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
              {hero.accent.map((line) => (
                <span className="cpn-accent" key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </h1>

            <p>{hero.text}</p>

            <div className="cpn-hero-actions">
              <a
                className="cpn-btn cpn-btn--orange cpn-btn--lg"
                href={APP_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                {hero.cta}
              </a>
              <a className="cpn-hero-link" href="#how-it-works">
                See how it works <ChevronRight size={16} strokeWidth={2.5} />
              </a>
            </div>
          </div>
        </div>

        <div className="cpn-hero-art">
          {HERO_SLIDES.map((item, index) => (
            <img
              key={item.id}
              src={item.art}
              alt={index === slide ? item.alt : ""}
              aria-hidden={index === slide ? undefined : "true"}
              className={index === slide ? "is-active" : ""}
            />
          ))}
        </div>

        <div className="cpn-hero-dots" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-label={`Show slide ${index + 1}`}
              aria-selected={slide === index}
              className={slide === index ? "is-active" : ""}
              onClick={() => setSlide(index)}
            />
          ))}
        </div>

        <Wave variant="hero" />
      </section>

      {/* ================= Why ClubPass ================= */}
      <section className="cpn-section cpn-why">
        <div className="cpn-container">
          <p className="cpn-kicker cpn-kicker--center">Why Clubpass?</p>
          <h2 className="cpn-h2 cpn-h2--center">
            Getting home after 2am shouldn't
            <br />
            be the hardest part of the night.
          </h2>

          <div className="cpn-compare">
            <div className="cpn-compare-plain">
              <p className="cpn-compare-label">Tonight, without Clubpass</p>
              <ul>
                {WITHOUT_CLUBPASS.map((item) => (
                  <li key={item}>
                    <span className="cpn-mark cpn-mark--x">
                      <X size={13} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cpn-compare-card">
              <img className="cpn-boombox" src={`${IMG}/boombox.png`} alt="" aria-hidden="true" />
              <p className="cpn-compare-label cpn-compare-label--orange">Tonight, with Clubpass</p>
              <ul>
                {WITH_CLUBPASS.map((item) => (
                  <li key={item}>
                    <span className="cpn-mark cpn-mark--check">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= How it works ================= */}
      <section className="cpn-section cpn-how" id="how-it-works">
        <div className="cpn-container">
          <p className="cpn-kicker">How it Works</p>

          <div className="cpn-how-head">
            <img className="cpn-dj" src={`${IMG}/dj-decks.png`} alt="" aria-hidden="true" />
            <div className="cpn-how-copy">
              <h2 className="cpn-h2">From dance floor to doorstep</h2>
              <p>
                Already a RewardLand user? You're signed in automatically - no new account, no new
                app.
              </p>
            </div>
          </div>

          <ol className="cpn-steps">
            {STEPS.map((step) => (
              <li className="cpn-step" key={step.num}>
                <img src={`${IMG}/num-${step.num}.png`} alt={`Step ${step.num}`} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <span className="cpn-step-meta">{step.meta}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= Routes ================= */}
      <section className="cpn-section cpn-routes" id="routes">
        <div className="cpn-container">
          <img className="cpn-bus" src={`${IMG}/party-bus.png`} alt="" aria-hidden="true" />

          <p className="cpn-kicker">Routes</p>
          <h2 className="cpn-h2">One Island. Four Routes.</h2>
          <p className="cpn-routes-lead">
            East is live today, West, North and South unlock as neighbours register interest - one
            vote per route, five seconds.
          </p>

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

            <span className="cpn-stops-arrow" aria-hidden="true">
              <svg viewBox="0 0 28 22" width="28" height="22">
                <path d="M0 7h13V0l15 11-15 11v-7H0z" fill="#c9c9cf" />
              </svg>
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
              <p className="cpn-stops-note">*Subject to demand. Full timings in the app</p>
            </div>
          </div>

          <div className="cpn-map-wrap">
            <img className="cpn-squiggle" src={`${IMG}/squiggle.png`} alt="" aria-hidden="true" />
            <img className="cpn-speaker" src={`${IMG}/speaker.png`} alt="" aria-hidden="true" />
            <div className="cpn-map">Google map</div>
          </div>

          <div className="cpn-route-grid">
            {VOTE_ROUTES.map((route) => (
              <div className="cpn-route-card" key={route.key}>
                <h4>{route.name}</h4>
                <div className="cpn-route-count">{route.count}</div>
                <small>more members needed</small>
                <div className="cpn-progress">
                  <span style={{ width: `${route.progress}%` }} />
                </div>
                <button
                  type="button"
                  className="cpn-btn cpn-btn--outline"
                  onClick={() => voteRoute(route.key)}
                  disabled={votedRoutes.includes(route.key)}
                >
                  {votedRoutes.includes(route.key) ? "Vote counted" : "I want this route"}
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
                {votedRoutes.includes("south") ? "You're on the list" : "I want this route"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Schedule & safety ================= */}
      <section className="cpn-safety">
        <Wave variant="cap-bottom" />

        <div className="cpn-container cpn-safety-inner">
          <p className="cpn-kicker cpn-kicker--light">Schedule &amp; Safety</p>

          <div className="cpn-safety-head">
            <h2 className="cpn-h2 cpn-h2--light">
              Planned like transit.
              <br />
              Protected like a members' club.
            </h2>
            <p>
              Fixed nights, fixed stops, verified riders. Nothing about your ride home is left to
              chance.
            </p>
          </div>

          <div className="cpn-safety-top">
            <div className="cpn-nights">
              <img src={`${IMG}/num-4.png`} alt="4" />
              <div>
                <h3>nights a month - one night a week, every week</h3>
                <p>
                  Departures are fixed and published ahead of time; exact timings live in the app.
                  Your price never changes - no surge, ever.
                </p>
              </div>
            </div>

            <div className="cpn-safety-card">
              <span className="cpn-safety-icon">
                <Clock size={26} strokeWidth={1.6} />
              </span>
              <h3>On the dot</h3>
              <p>Departures run on the clock - never "when the bus fills up"</p>
            </div>
          </div>

          <div className="cpn-safety-grid">
            {SAFETY_CARDS.map((card) => (
              <div className="cpn-safety-card" key={card.title}>
                {card.icon && <span className="cpn-safety-icon">{card.icon}</span>}
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </div>

        <Wave variant="cap-top" />
      </section>

      {/* ================= Membership ================= */}
      <section className="cpn-section cpn-membership" id="membership">
        <div className="cpn-container cpn-membership-grid">
          <div className="cpn-membership-copy">
            <p className="cpn-kicker cpn-kicker--orange">Membership</p>
            <h2 className="cpn-h2">
              One simple membership.
              <br />
              No surge maths.
            </h2>
            <p className="cpn-membership-lead">
              A single monthly subscription inside the RewardLand app. It renews automatically, and
              you can cancel in two taps - no lock-in, no hidden fees.
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
            <img className="cpn-starburst" src={`${IMG}/starburst.png`} alt="" aria-hidden="true" />
            <img className="cpn-skater" src={`${IMG}/skater.png`} alt="" aria-hidden="true" />
            <span className="cpn-spark cpn-spark--1" aria-hidden="true" />
            <span className="cpn-spark cpn-spark--2" aria-hidden="true" />

            <div className="cpn-ticket">
              <div className="cpn-ticket-head">Clubpass - Home Express</div>

              <div className="cpn-ticket-body">
                <div className="cpn-price">
                  SGD$19.90<span>/mth</span>
                </div>
                <p className="cpn-ticket-note">
                  Founder launch price - First 150 members only. Locked in for as long as you stay
                  subscribed.
                </p>
              </div>

              <div className="cpn-ticket-rip" aria-hidden="true" />

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
                  <br />
                  Cancel anytime in the app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="cpn-section cpn-faq" id="faq">
        <img className="cpn-discoball" src={`${IMG}/discoball.png`} alt="" aria-hidden="true" />

        <div className="cpn-container">
          <p className="cpn-kicker cpn-kicker--orange">FAQ</p>

          <div className="cpn-faq-grid">
            <div className="cpn-faq-copy">
              <h2 className="cpn-h2">
                Good questions,
                <br />
                straight answers
              </h2>
              <p>Anything we missed? Full details live in the RewardLand app.</p>
            </div>

            <div className="cpn-acc">
              {FAQS.map((faq, index) => (
                <div className={`cpn-acc-item${openFaq === index ? " is-open" : ""}`} key={faq.q}>
                  <button
                    type="button"
                    aria-expanded={openFaq === index}
                    onClick={() => setOpenFaq((prev) => (prev === index ? null : index))}
                  >
                    <span>{faq.q}</span>
                    {openFaq === index ? <Minus size={18} /> : <Plus size={18} />}
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
            <img className="cpn-cta-bus" src={`${IMG}/cta-bus.png`} alt="" aria-hidden="true" />
            <span className="cpn-cta-bubble">I'll get you home safely!</span>
            <h2>Be one of the first 150.</h2>
            <p>
              Founder pricing ends when the seats are gone. Lock in SGD$19.90/mth and be part of
              Clubpass from night one.
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
    </div>
  );
}
