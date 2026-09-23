import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Minus,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Menu,
  Star,
  UserRound,
  X,
} from "lucide-react";

import "../css/clubpass.css";
import useRouteVoting from "../hooks/useRouteVoting.js";
import "../css/clubpass-new.css";
import { readMemberSession } from "../api/auth.js";
import { isPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import SubscribeModal from "../components/SubscribeModal.jsx";
import UserMenu from "../components/UserMenu.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { ClubpassUserContext } from "../components/clubpassUserContext.js";
import { useTickets } from "../hooks/useTickets.js";
import useHome from "../hooks/useHome.js";

const IMG = "/images/cpn";

/* =========================================================
   HERO SLIDER
========================================================= */

/**
 * The copy the page ships with. Strapi replaces it once /api/home answers —
 * see useHome — but it renders first so the landing page is never blank and
 * survives the CMS being unreachable.
 */
/**
 * What the CMS doesn't carry per route: the pin and route-map artwork, and the
 * fallback thumbs-up when a route has no voting image. Keyed by the route's
 * slug ("NORTH EASTIES" -> "north-easties"), which is also its CSS class.
 */
const ROUTE_THEMES = {
  easties: { pin: "/images/map-pin.png", map: "/images/map-easties.svg", thumb: "/images/thumbs-up-ea.svg", highlight: true },
  westies: { pin: "/images/map-pin-we.png", map: "/images/map-westies.svg", thumb: "/images/thumbs-up-we.svg" },
  "north-easties": { pin: "/images/map-pin-ne.png", map: "/images/map-north-e.svg", thumb: "/images/thumbs-up-ne.svg" },
  "north-westies": { pin: "/images/map-pin-nw.png", map: "/images/map-north-w.svg", thumb: "/images/thumbs-up-nw.svg" },
};

const FALLBACK_CONTENT = {
  howItWorks: {
    eyebrow: "how it works",
    heading: "Join the club.\nEnjoy perks that keep growing.",
    paragraph:
      "Clubpass is your pass to exclusive access, rewards and experiences with more benefits on the way.",
    image: null,
    steps: [
      { id: "step-1", img: "/images/one.png", meta: "/images/join-one.png", title: "CREATE\nACCOUNT", text: "Create a free account and subscribe to Clubpass membership. " },
      { id: "step-2", img: "/images/two.png", meta: "/images/join-two.png", title: "EXPLORE & \nENJOY", text: "Discover events, enjoy free entries and member perks. More benefits coming soon!" },
      { id: "step-3", img: "/images/three.png", meta: "/images/join-three.png", title: "EARN REWARDS \n(COMING SOON) ", text: "Earn R coins (reward points) when you buy tickets and F&B coupons. " },
      { id: "step-4", img: "/images/four.png", meta: "/images/join-four.png", title: "RIDE HOME \n(COMING SOON)", text: "Unlock your route and enjoy a safe, comfortable ride home after the party." },
    ],
  },
  hero: [
    {
      id: "fallback-hero",
      image: `${IMG}/cp-one-banner.png`,
      title: "Your pass to more.",
      accent: "More access. More perks.",
      text: "Free entries, member ticket prices, R coins and more - with new Clubpass benefits rolling out throughout the year.",
      linkText: "See how it works",
      linkUrl: "#how-it-works",
      buttonText: "Become a Founding Member",
      buttonLink: "/signup",
    },
  ],
  beforeTickets: {
    badge: "AVAILABLE NOW",
    heading: "Your membership already gets you in.",
    description:
      "Enjoy **FREE ENTRY** at selected Clubpass partner venues and events included with your membership",
    image: null,
    benefits: [
      { id: "b1", text: "Included from day one" },
      { id: "b2", text: "No additional entry fee" },
      { id: "b3", text: "One night out could already cover your membership" },
    ],
  },
  afterTickets: {
    items: [
      {
        id: "info-1",
        icon: "/images/gift.svg",
        title: "Free entry is included is with your Clubpass membership.",
        text: "Join for **S$17.90/month** and start enjoying participating venues and events now.",
      },
      {
        id: "info-2",
        icon: "/images/users.svg",
        title: "More venues. More events. More perks.",
        text: "We're adding new partners and member benefits all the time. Stay tuned!",
      },
    ],
    declaration: "Free entry is subject to venue terms and conditions. Specific events and dates may apply.",
  },
  cta: {
    heading: "Be one of the first 150.",
    description:
      "Founder pricing ends when the seats are gone. Lock in SGD$17.90/mth and be part of Clubpass from night one.",
    buttonText: "Sign Up Now",
    buttonLink: "/signup",
    image: `${IMG}/music-girl.png`,
  },
  beta: {
    kicker: "CLUBPASS BETA",
    heading: "Be a founding member.\nHelp shape the future of Clubpass.",
    description:
      "Limited to 150 founding members only.\nJoin the beta program, lock in the founder price and get exclusive launch rewards.",
    benefits: [
      { id: "beta-1", text: "Founder price locked in" },
      { id: "beta-2", text: "Exclusive launch rewards" },
      { id: "beta-3", text: "Limited to 150 members" },
      { id: "beta-4", text: "Cancel anytime, no lock-in" },
    ],
    ticket: {
      title: "Clubpass",
      tag: "BETA",
      heading: "FOUNDER",
      description: "Limited to first 150 members.",
      price: "SGD $17.90/month",
      uptoPrice: "(U.P. S$24.90)",
      activeTag: "Active",
      buttonText: "Become a founding member",
      buttonLink: "/signup",
      info: "Auto-renewed at founder rate. Cancel anytime.",
      declaration: "Rate locked for 12 months",
    },
  },
  faq: {
    kicker: "FAQ",
    heading: "Good questions, straight answers",
    description: "Anything we missed?",
    otherInfo: "Full details live in the RewardLand app.",
    image: "/images/cp-bus.png",
    items: [
      { id: "faq-1", question: "What is Clubpass Home Express?", answer: "A monthly membership for scheduled late-night coaches: a pick-up loop through the city's nightlife spots, then express drop-offs in the East. Fixed schedule, fixed price, no surge, no waiting for a driver at 3am." },
      { id: "faq-2", question: "Is this safe? Who operates the buses?", answer: "Rides are run by licensed Singapore coach operators with professional drivers and full-size, air-conditioned vehicles. Every seat is booked to a verified RewardLand member and boarding is QR-verified, so nobody rides who isn't a member." },
      { id: "faq-3", question: "How many rides do I get?", answer: "Your membership covers four operating nights a month one night a week, every week. Exact timings and the published departure board live in the RewardLand app." },
      { id: "faq-4", question: "Do I need a new account or app?", answer: "No. Clubpass sits inside the RewardLand app you already have. If you're an existing user you're signed in automatically no new account, no second app to download." },
      { id: "faq-5", question: "How does billing and cancellation work?", answer: "S$17.90 is charged monthly to your payment method in the app and renews automatically. You can cancel in two taps from your membership screen there's no lock-in and no cancellation fee." },
      { id: "faq-6", question: "My route isn't live yet — what can I do?", answer: "Register your interest for West, North or South. Each route unlocks once enough neighbours vote for it one vote per route, five seconds. We'll notify you the moment yours goes live." },
    ],
  },
  why: {
    eyebrow: "why clubpass?",
    heading: "More ways to enjoy going out.",
    description:
      "Clubpass brings together access, savings, rewards, and experiences with more benefits rolling out as we grow.",
    consHeading: "Tonight, without Clubpass",
    cons: [
      { id: "c1", text: "Regular ticket prices" },
      { id: "c2", text: "Standard event access" },
      { id: "c3", text: "No rewards for your spending" },
      { id: "c4", text: "Getting home is still your problem" },
    ],
    proHeading: "Tonight, with Clubpass",
    pro: [
      { id: "p1", text: "Free entry at selected events & venues", pill: "AVAILABLE NOW", pillClass: "cl-box available" },
      { id: "p2", text: "Exclusive member ticket prices", pill: "COMING OCT", pillClass: "cl-box coming-oct" },
      { id: "p3", text: "Earn R coins on tickets & F&B coupons", pill: "COMING OCT", pillClass: "cl-box coming-oct" },
      { id: "p4", text: "Clubpass Home Express", pill: "COMING SOON", pillClass: "cl-box coming-soon" },
    ],
  },
};

/**
 * Line breaks in CMS copy. Strapi's text field keeps real newlines, but some
 * entries have "\\n" typed in as literal characters — both mean a new line.
 */
function multiline(text) {
  return String(text)
    .split(/\r?\n|\\n/)
    .flatMap((line, index) => (index ? [<br key={index} />, line] : [line]));
}

/** Local benefit illustrations, used when a CMS benefit has no image. */
const BETA_ICONS = ["/images/cb-one.png", "/images/cb-two.png", "/images/cb-three.png", "/images/cb-four.png"];

/** Renders Strapi's **bold** markers, which the CMS copy uses inline. */
function withBold(text) {
  return String(text)
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => (index % 2 ? <strong key={index}>{part}</strong> : part));
}

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Route & schedule", href: "#routes" },
  { label: "Membership", href: "#membership" },
  { label: "FAQ", href: "#faq" },
];

const PICKUPS = [
  "Orchard Road",
  "Clarke Quay",
  "Tanjong Pagar",
  "Cecil Street",
  "Marina Bay Sands"

  // "Marina Bay Sands (Marquee / Avenue)",
  // "CE LA VI",
  // "Clarke Quay Central",
  // "Boat Quay / Headquarters",
  // "Zouk / Capital",
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
    text: "Full-size, air-conditioned coaches with professional drivers not ad-hoc rides found at 3am.",
  },
  {
    icon: <img src="/images/rl-icon.png" />,
    title: "Ride with your crew",
    text: "Same coach, seats together the night ends the way it started.",
  },
];

const MEMBER_BENEFITS = [
  "4 operating nights every month",
  "All city pick-up points on the loop",
  "Express drop-offs across the East",
  "Founder Member status & launch rewards",
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
  const navigate = useNavigate();
  const { hash } = useLocation();

  // Arriving with a hash from another route (e.g. back out of an event, which
  // returns to /#venues) doesn't scroll on its own — the section isn't in the
  // document yet when the browser would have done it. A frame later it is.
  useEffect(() => {
    if (!hash) return;

    const frame = requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView();
    });

    return () => cancelAnimationFrame(frame);
  }, [hash]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [openRoute, setOpenRoute] = useState("easties");

  // Everything above the venue grid is editorial, and comes from Strapi.
  const { hero: heroSlides, beforeTickets, afterTickets, cta, faq, beta, why, howItWorks } =
    useHome(FALLBACK_CONTENT);

  // The venue grid is whatever events Strapi is publishing — public ones only.
  // A private event is still reachable by its own link.
  const { tickets: allEvents, status: eventsStatus } = useTickets();
  const events = useMemo(() => allEvents.filter((event) => event.isPublic), [allEvents]);

  // This page is public (not behind UserGate), so a signed-out visitor still
  // sees the full page — the header just reflects whichever state applies.
  const [session, setSession] = useState(() => readMemberSession());
  const userName = session?.user?.username ?? null;

  // Resolved separately from the session: knowing someone is logged in isn't
  // knowing they've paid — that lives on the Strapi record, not localStorage.
  const [clubpassUser, setClubpassUser] = useState(null);

  useEffect(() => {
    if (!session?.user?.username) {
      setClubpassUser(null);
      return;
    }

    let cancelled = false;
    resolveClubpassUser(session.user).then(
      (user) => {
        if (!cancelled) setClubpassUser(user);
      },
      (error) => {
        console.error("ClubPass user lookup failed", error);
        if (!cancelled) setClubpassUser(null);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [session]);

  const paid = isPaid(clubpassUser);

  // Routes, their tallies and the member's one vote — all from Strapi.
  const { routes, votedRoute, pendingRoute, vote, error: voteError } = useRouteVoting({
    user: clubpassUser,
    setUser: setClubpassUser,
  });
  const [lastVotedRoute, setLastVotedRoute] = useState(null);

  // The membership CTAs pitch in place rather than sending anyone off to the
  // membership page — SubscribeModal reads its member off context, which this
  // page isn't inside, so it's supplied around the sheet below.
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const subscribeUser = useMemo(
    () => ({
      userName: userName ?? "",
      user: clubpassUser,
      profile: session?.user ?? null,
      setUser: setClubpassUser,
    }),
    [userName, clubpassUser, session],
  );

  /* =========================================
     HERO SLIDER STATE
  ========================================= */

  const [activeHero, setActiveHero] = useState(0);

  // Keyed on activeHero so the timer restarts whenever the slide changes —
  // without that, clicking an arrow could be followed a moment later by the
  // auto-advance firing on the old schedule.
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHero((prev) => {
        return (prev + 1) % heroSlides.length;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeHero]);

  /** Steps the hero by `delta`, wrapping around at either end. */
  const stepHero = (delta) =>
    setActiveHero((prev) => (prev + delta + heroSlides.length) % heroSlides.length);

  const currentHero = heroSlides[activeHero] ?? heroSlides[0];

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const toggleRoute = (key) => {
    setOpenRoute((prev) => (prev === key ? null : key));
  };

  // Panels stay mounted (just visually clipped) so their scrollHeight is always
  // measurable — used to drive max-height with a real pixel value, since CSS
  // can't transition smoothly to/from a keyword like max-content.
  const routeContentRefs = useRef({});

  const setRouteContentRef = (key) => (el) => {
    routeContentRefs.current[key] = el;
  };

  const getRouteMaxHeight = (key) =>
    openRoute === key ? routeContentRefs.current[key]?.scrollHeight : 0;

  // A vote is spent against an account — "free account required", as the vote
  // box says — so a signed-out tap goes to login first and comes back here.
  // Signed in, voting itself still happens in the app.
  const voteRoute = (route) => (event) => {
    event?.preventDefault();

    if (!userName) {
      navigate("/login", { state: { from: "/#routes" } });
      return;
    }

    // One vote per account, only once the member record has loaded, and not
    // while another vote is still waiting on the API.
    if (!clubpassUser || votedRoute || pendingRoute || !route.open) return;

    setLastVotedRoute(route.id);
    vote(route);
  };

  return (
    <div className="clubpass-page cpn-page">
      <title>Clubpass by Reward Land | Exclusive Perks, Events &amp; Member Benefits</title>

      <meta
        name="description"
        content="Discover Clubpass by Reward Land, a membership for exclusive perks, special rates, R Coins and curated experiences across Singapore."
      />

      {/* ================= Header ================= */}

      <header className="cp-header">
        <div className="cp-container cp-header-inner">
          <a className="cp-brand" href="#top">
            <img src="/images/cp-logo.png" />
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
            {userName ? (
              <UserMenu userName={userName} onSignedOut={() => setSession(null)} />
            ) : (
              <Link
                className="cp-btn cp-btn-purple cp-btn-sm"
                to="/login"
              >
                Login / Sign up
              </Link>
            )}

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
              {/* <span className="cp-tag">
                Clubpass · Home Express by RewardLand
              </span> */}

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
                href={currentHero.linkUrl || "#how-it-works"}
              >
                {currentHero.linkText || "See how it works"}

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
              <div className="club-beta">
                 <div className="club-beta-top">
                    <div className="club-beta-icon">
                      <img src="/images/sparkle-icon-wrapper.svg"/>
                    </div>
                     <div className="club-beta-text">
                       <h4>CLUBPASS BETA</h4>
                       <p>Limited to 150 founding members</p>
                     </div>
                 </div>
                 <div className="club-beta-bottom">
                    <div className="club-beta-left">
                      <img src="/images/tag.svg"/>
                      <span>
                        <b>S$17.90/month </b><br/>
                        (U.P. S$24.90)
                      </span>
                    </div>
                     <div className="club-beta-right">
                      <img src="/images/lock.svg"/>
                       <p>Rate locked for 12 months</p>
                    </div>
                 </div>
              </div>
              <div className="cp-hero-actions">
                {!paid && (userName ? (
                  <button
                    type="button"
                    className="cp-btn cp-btn-white"
                    onClick={() => setSubscribeOpen(true)}
                  >
                    {currentHero.buttonText || "Become a Founding Member"}
                  </button>
                ) : (
                  <Link
                    className="cp-btn cp-btn-white"
                    to={'/signup'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Become a Founding Member
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ================= Slider Arrows ================= */}

          <button
            type="button"
            className="cp-hero-arrow cp-hero-arrow--prev"
            onClick={() => stepHero(-1)}
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            className="cp-hero-arrow cp-hero-arrow--next"
            onClick={() => stepHero(1)}
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* ================= Slider Dots ================= */}

          <div className="cp-hero-slider-dots">
            {heroSlides.map((_, index) => (
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
            <p className="cp-eyebrow">{why.eyebrow}</p>

            <h2 className="cp-h2">{why.heading}</h2>
            <p>{why.description}</p>
          </div>

          <div className="cp-compare">
            <div className="cp-card-plain">
              <p className="cp-card-label">{why.consHeading}</p>

              <ul className="cp-list">
                {why.cons.map((item) => (
                  <li key={item.id}>
                    <span className="cp-ico cp-ico-x">
                      <X size={14} strokeWidth={3} />
                    </span>

                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cp-card-dark">
              <p className="cp-card-label">{why.proHeading}</p>

              <ul className="cp-list">
                {why.pro.map((item) => (
                  <li key={item.id}>
                    <span className="cp-ico cp-ico-check">
                      <Check size={14} strokeWidth={3} /> 
                    </span>

                    <div className="pl-item">
                      <span>{item.text}</span>
                      {item.pill && <span className={item.pillClass}>{item.pill}</span>}
                    </div>
                    
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
              src={beforeTickets.image || "/images/dj-decks.png"}
            />
          </div>
        </div>
      </div>



<section className="membership-section cp-container" id="venues">
  <div className="status">{beforeTickets.badge}</div>

  <h2>{beforeTickets.heading}</h2>

  <div className="intro">{withBold(beforeTickets.description)}</div>

  <div className="benefits">
    {beforeTickets.benefits.map((benefit) => (
      <div className="benefit" key={benefit.id}>
        <span className="cpn-mark cpn-mark--check">
          <Check size={13} strokeWidth={3} />
        </span>
        <span>{benefit.text}</span>
      </div>
    ))}
  </div>

  <div className="venue-grid">

    {eventsStatus === "loading" && (
      <p className="venue-note">Loading events…</p>
    )}

    {eventsStatus === "error" && (
      <p className="venue-note">Events couldn't be loaded right now. Please try again shortly.</p>
    )}

    {events.map((event) => (
      <Link className="venue" key={event.id} to={`/events/${event.id}`}>
        <div className="venue-image">
          {event.images[0] && <img src={event.images[0]} alt="" />}
          {event.dateBadge && <span className="venue-date">{event.dateBadge}</span>}
        </div>

        <div className="venue-body">
          {event.memberCoins != null && (
            <p className="venue-coins">
              Earn up to {event.memberCoins.toLocaleString()} R Coins
              <Info size={13} />
            </p>
          )}

          <h3 className="venue-title">{event.title}</h3>
          <p className="venue-venue">{event.venue}</p>

          <div className="venue-prices">
            {event.publicTier && (
              <div className="venue-price">
                <span>{event.publicTier.label}</span>
                <b>From ${event.publicTier.price}</b>
              </div>
            )}

            {event.memberTier && (
              <div className="venue-price venue-price--member">
                <span>
                  Member <Star size={11} fill="currentColor" />
                </span>
                <b>From ${event.memberTier.price}</b>
                {event.memberSaving > 0 && <small>Save {event.memberSaving}%</small>}
              </div>
            )}
          </div>
        </div>
      </Link>
    ))}

    <article className="coming">
      <div className="plus">+</div>
      <strong>More partners coming soon</strong>
      <span>New venues and events added<br/>regularly.</span>
    </article>

  </div>

  <div className="info">
    {afterTickets.items.map((item, index) => (
      <React.Fragment key={item.id}>
        {index > 0 && <div className="info-divider"></div>}
        <div className="info-item">
          {item.icon && (
            <div className="info-icon"><img src={item.icon} alt="" /></div>
          )}
          <div>
            <div className="info-title">{item.title}</div>
            <div className="info-copy">{withBold(item.text)}</div>
          </div>
        </div>
      </React.Fragment>
    ))}
  </div>

  {afterTickets.declaration && <div className="terms">{afterTickets.declaration}</div>}
</section>

  {/* ================= Membership ================= */}

      <section
        className="cpn-section cpn-membership"
        id="membership"
      >
        <img className="tt-top" src="/images/tt-top.png"/>
        <div className="tt-membership">
        <div className="cpn-container cpn-membership-grid">
          <div className="cpn-membership-copy">
            <p className="cpn-kicker cpn-kicker--orange">{beta.kicker}</p>

            <h2 className="cpn-h2">{multiline(beta.heading)}</h2>

            <p className="cpn-membership-lead">{multiline(beta.description)}</p>

              <ul className="col-mb-list">
                {beta.benefits.map((benefit, index) => (
                  <li key={benefit.id}>
                    <img src={benefit.image || BETA_ICONS[index % BETA_ICONS.length]} alt="" />
                    <p>{benefit.text}</p>
                  </li>
                ))}
              </ul>
            {/* <ul className="cpn-benefits">
              {MEMBER_BENEFITS.map((benefit) => (
                <li key={benefit}>
                  <span className="cpn-mark cpn-mark--check">
                    <Check size={13} strokeWidth={3} />
                  </span>

                  {benefit}
                </li>
              ))}
            </ul> */}
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
                <span>{beta.ticket.title}</span>
                <span>{beta.ticket.tag}</span>
              </div>

              <div className="cpn-ticket-body">
                <div className="cpn-price">{beta.ticket.heading}</div>

                <p className="cpn-ticket-note">{beta.ticket.description}</p>
              </div>

              <div className="cpn-ticket-rip" />

              <div className="cpn-ticket-foot">
                <dl className="cpn-ticket-stats">
                  {/* <div>
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
                  </div> */}
                  <span className="ticket-price">
                    {beta.ticket.price}
                    <br />
                    {beta.ticket.uptoPrice && <p>{beta.ticket.uptoPrice}</p>}
                  </span>
                  {beta.ticket.activeTag && <span className="ticket-active">{beta.ticket.activeTag}</span>}
                </dl>

                {!paid && (userName ? (
                  <button
                    type="button"
                    className="cpn-btn cpn-btn--white"
                    onClick={() => setSubscribeOpen(true)}
                  >
                    {beta.ticket.buttonText || "Become a founding member"}
                  </button>
                ) : (
                  <Link
                    className="cpn-btn cpn-btn--white"
                    to={beta.ticket.buttonLink || "/signup"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {beta.ticket.buttonText || "Become a founding member"}
                  </Link>
                ))}

                <p className="cpn-ticket-fine">{beta.ticket.info}</p>
              </div>
            </div>
            {beta.ticket.declaration && (
              <div className="locked-text">
                <img src="/images/lock.svg" alt="" />
                <p>{beta.ticket.declaration}</p>
              </div>
            )}
          </div>
        </div>
        </div>
         <img className="tt-top tt-bottom" src="/images/tt-top.png"/>
      </section>

      
        {/* ================= How it works ================= */}

        <section
          className="cp-section"
          id="how-it-works"
          style={{ paddingTop: 0 }}
        >
          <div className="cp-container">
            <div className="cp-split-head">
              <div className="cp-work-text">
                <p className="cp-eyebrow">{howItWorks.eyebrow}</p>

                <h2 className="cp-h2">{multiline(howItWorks.heading)}</h2>

                <p className="cp-note">{howItWorks.paragraph}</p>
              </div>
            </div>

            <div className="cp-steps">
              {howItWorks.steps.map((step, index) => {
                // A step saved without its images keeps the shipped artwork.
                const fallback = FALLBACK_CONTENT.howItWorks.steps[index];
                const img = step.img ?? fallback?.img;
                const meta = step.meta ?? fallback?.meta;

                return (
                  <div className="cp-step" key={step.id}>
                    <div className="cp-step-num">
                      {img && <img src={img} alt={step.title} />}
                      {meta && (
                        <span className="cp-step-meta mobile-mt">
                          <img src={meta} alt="" />
                        </span>
                      )}
                    </div>

                    <h3 className="step-title">{multiline(step.title)}</h3>

                    <p>{step.text}</p>

                    {meta && (
                      <span className="cp-step-meta desk-mt">
                        <img src={meta} alt="" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

         {/* ================= rewards-section ================= */}

        <section  className="cp-section  rewards-section" >
          <div className="cp-container">
            <div className="cp-split-head">
              <div className="cp-work-text">
                <p className="cp-eyebrow">CLUBPASS REWARDS<span className="rewards-coming">Available Now</span></p>
                <h2 className="cp-h2">Going out has its rewards. Literally.</h2>
                <p className="cp-note">Buy tickets and F&B coupons on Clubpass and earn R coins with every purchase. The first and only membership that rewards you for going out.</p>
              </div>
            </div>
            <div className="rewards-body">
                <div className="rw-box rw-one">
                  <div className="rw-box-image ">
                    <img src="/images/buy.png"/>
                  </div>
                  
                  <h3>BUY</h3>
                  <p>Tickets, F&B coupons and more on Clubpass.</p>
                </div>
                <div className="rw-box rw-inner">
                  <div className="rw-box-image">
                    <img src="/images/coin.png"/>
                  </div>
                  <h3>EARN R COINS</h3>
                  <p>Earn R coins with every purchase.</p>
                </div>
                <div className="rw-box rw-inner">
                  <div className="rw-box-image">
                    <img src="/images/brand.png"/>
                  </div>
                  
                  <h3>REDEEM AT 170+ BRANDS</h3>
                  <p>...and many more!</p>
                </div>
            </div>
              <div className="rewards-footer">
                <img src="./images/gift-icon.png"/>
                  <p>From your next Grab ride to groceries, shopping and everyday treats - your Clubpass rewards go beyond the party.</p>
              </div>

          </div>
        </section>
<div className="cp-gradient">
        {/* ================= Routes ================= */}

        <section
          className="cpn-section cpn-routes"
          id="routes"
        >
       <div className="cp-split-head">
              <div className="cp-work-text">
                <h2 className="cp-h2">Where should we bring you home?</h2>
                <p className="cp-note">We’re planning Home Express routes from Singapore’s nightlife districts towards home.</p>
              </div>
            </div>

          <img
            className="cpn-island"
            src={`${IMG}/island.png`}
            alt=""
            aria-hidden="true"
          />

          <div className="cpn-container">

            <div className="cpn-route-head">
              <h3>But first, we need you.</h3>
              <p>Tell us which route you want most.</p>
            </div>
              <div className="col-interest">
                <div className="interest-number">
                  <h3>200 INTERESTS</h3>
                  <p>NEEDED FOR EACH ROUTE</p>
                </div>
                <div className="interest-image">
                  <img src="/images/cp-flower.png"/>
                </div>
                <div className="interest-text">
                  <p>When a route reaches 200 registered interests, we'll work towards bringing it to life.</p>
                </div>
                </div>
            <div className="cpn-stops">
              <div className="cpn-stops-col">
                <h4>Pick-up Loop - Same for all routes</h4>

                <ul>
                  {PICKUPS.map((stop) => (
                    <li key={stop}>
                      <span className="cpn-ring" />
                      {stop}
                    </li>
                  ))}
                </ul>
              </div>
                <div className="stop-image"><img src="/images/stop-new.png" /></div>
              {/* <span
                className="cpn-stops-arrow"
                aria-hidden="true"
              >
                <img src="/images/cp-arrow.svg" />
              </span> */}

              {/* <div className="cpn-stops-col">
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
              </div> */}
            </div>

    

           <div className="route-wrapper">
   <div className="cp-split-head">
              <div className="cp-work-text">
                <h2 className="cp-h2">Where are you heading?</h2>
                <p className="cp-note">Choose the Home Express route you’d use most and help your side unlock it.</p>
              </div>
            </div>

    {routes.map((route) => {
      const key = route.slug;
      const theme = ROUTE_THEMES[key] ?? ROUTE_THEMES.easties;
      const isOpen = openRoute === key;
      const isMine = votedRoute === route.id;
      const isVoting = pendingRoute === route.id;
      // Waiting on the member lookup counts as "can't vote yet", not "voted".
      const locked = Boolean(votedRoute) || !route.open || (userName && !clubpassUser);

      return (
        <div key={route.id} className={`route-item ${key}${isOpen ? " active" : ""}`}>
          <div className="route-header" onClick={() => toggleRoute(key)}>
            <div className="route-left">
              <div className="route-title-row">
                <div className="route-title">{route.title}</div>
                <div className="route-route">— {route.name} ROUTE</div>
              </div>

              <div className="route-description">{route.subTitle}</div>
            </div>

            <div className="progress-area">
              <div className="progress-top">
                <div>
                  <span className="progress-number">{route.voted}</span>
                  <span className="progress-total">/ {route.required}</span>
                </div>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${route.progress}%` }}></div>
              </div>
            </div>

            <div className="unlock">
              <strong>
                {route.remaining > 0 ? `${route.remaining} more to unlock` : "Unlocked"}
              </strong>
              <span>Active Campaign</span>
            </div>

            <div className="toggle">{isOpen ? "−" : "+"}</div>
          </div>

          <div
            className="route-content"
            ref={setRouteContentRef(key)}
            style={{ maxHeight: getRouteMaxHeight(key) }}
          >
            <div className="route-content-inner">
              <div className="dropoff">
                <div className="dropoff-title">{route.dropoffHeading}</div>

                <ul className="dropoff-list">
                  {route.dropPoints.map((point) => (
                    <li key={point.id}>
                      <img src={theme.pin} alt="" />
                      {point.name}
                    </li>
                  ))}
                </ul>

                {route.mapLinkText && route.mapLink && (
                  <a
                    href={route.mapLink ?? "#"}
                    className="route-link"
                    {...(route.mapLink && route.mapLink !== "#"
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {route.mapLinkText} <img src={theme.map} alt="" />
                  </a>
                )}
              </div>

              {/* The mini map is drawn for four stops, so only the first four are labelled. */}
              <div className="map-box">
                <div className="map-line"></div>

                {route.dropPoints.slice(0, 4).map((point, index) => (
                  <React.Fragment key={point.id}>
                    <div className={`map-point point-${index + 1}`}></div>
                    <div className={`map-label label-${index + 1}`}>
                      {point.name.replace(/\s+MRT$/i, "")}
                    </div>
                  </React.Fragment>
                ))}

                {theme.highlight && route.dropPoints[2] && (
                  <>
                    <div className="map-highlight">
                      {route.dropPoints[2].name.replace(/\s+MRT$/i, "")}
                    </div>
                    <div className="map-location location-2"><img src="/images/map-pin.png" alt="" /></div>
                    <div className="map-location location-3"><img src="/images/map-pin.png" alt="" /></div>
                  </>
                )}
              </div>

              <div className="vote-box">
                <div className="vote-title">{route.votingTitle}</div>

                <div className="vote-icon">
                  <img src={route.votingImage ?? theme.thumb} alt="" />
                </div>

                <a
                  href="#"
                  className={`vote-button${isVoting ? " is-loading" : ""}${(locked || pendingRoute) && userName && !isVoting ? " is-disabled" : ""}`}
                  aria-disabled={Boolean((locked || pendingRoute) && userName)}
                  aria-busy={isVoting}
                  onClick={voteRoute(route)}
                >
                  {isVoting ? (
                    <>
                      <span className="vote-spinner" aria-hidden="true" />
                      Voting…
                    </>
                  ) : isMine ? (
                    "Your vote is counted"
                  ) : votedRoute ? (
                    "Already voted"
                  ) : (
                    route.votingButtonText
                  )}
                </a>

                {voteError && !isVoting && route.id === lastVotedRoute && (
                  <div className="vote-error" role="alert">{voteError}</div>
                )}

                <div className="vote-description">{multiline(route.moreInfo)}</div>
              </div>
            </div>
          </div>
        </div>
      );
    })}

</div>
          </div>
        </section>

 
      </div>

    

      {/* ================= FAQ ================= */}

      <section className="cpn-section cpn-faq" id="faq">
        <div className="cpn-container">
          <p className="cpn-kicker cpn-kicker--orange">{faq.kicker}</p>

          <div className="cpn-faq-copy">
            <h2 className="cpn-h2">{faq.heading}</h2>

            <p>
              {faq.description}
              {faq.description && faq.otherInfo && <br />}
              {faq.otherInfo}
            </p>
          </div>

          <div className="cpn-faq-grid">
            {faq.image && (
              <div className="cp-faq-image">
                <img src={faq.image} alt="" />
              </div>
            )}

            <div className="cpn-acc">
              {faq.items.map((item, index) => (
                <div
                  className={`cpn-acc-item${
                    openFaq === index ? " is-open" : ""
                  }`}
                  key={item.id}
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
                    <span>{item.question}</span>

                    {openFaq === index ? (
                      <Minus size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>

                  <div className="cpn-acc-panel">
                    <p>{item.answer}</p>
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
            {cta.image && (
              <img className="cpn-cta-bus" src={cta.image} alt="" aria-hidden="true" />
            )}

            <h2>{cta.heading}</h2>

            <p>{cta.description}</p>

            {!userName && (
              <Link
                className="cpn-btn cpn-btn--dark"
                to={cta.buttonLink || "/signup"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {cta.buttonText || "Sign Up Now"}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ================= Footer ================= */}

      <SiteFooter />

      <ClubpassUserContext.Provider value={subscribeUser}>
        <SubscribeModal
          open={subscribeOpen}
          onClose={() => setSubscribeOpen(false)}
          withUpsell
        />
      </ClubpassUserContext.Provider>
    </div>
  );
}

