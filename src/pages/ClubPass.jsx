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
import useRouteVoting from "../hooks/useRouteVoting.js";
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
    title: "Your pass to more.",
    accent: "More access. More perks.",
    text: "Free entries, member ticket prices, R coins and more - with new Clubpass benefits rolling out throughout the year. ",
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


const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Route & schedule", href: "#routes" },
  { label: "Membership", href: "#membership" },
  { label: "FAQ", href: "#faq" },
];

const WITHOUT_CLUBPASS = [
  "Regular ticket prices",
  "Standard event access",
  "No rewards for your spending",
  "Getting home is still your problem",
];

const WITH_CLUBPASS = [{
  "text":"Free entry at selected events & venues",
  "pill_text":"AVAILABLE NOW",
  "class":"cl-box available"

},{
  "text":"Exclusive member ticket prices",
  "pill_text":"COMING OCT",
   "class":"cl-box coming-oct"
},{
  "text":"Earn R coins on tickets & F&B coupons",
  "pill_text":"COMING OCT",
   "class":"cl-box coming-oct"
},{
  "text":"Clubpass Home Express",
  "pill_text":"COMING SOON",
   "class":"cl-box coming-soon"
}
  
];

const STEPS = [
  {
    img: "/images/one.png",
    num: "01",
    title: "CREATE\nACCOUNT",
    text: "Create a free account and subscribe to Clubpass membership. ",
    meta: "/images/join-one.png",
  },
  {
    img: "/images/two.png",
    num: "02",
    title: "EXPLORE & \nENJOY",
    text: "Discover events, enjoy free entries and member perks. More benefits coming soon!",
    meta: "/images/join-two.png",
  },
  {
    img: "/images/three.png",
    num: "03",
    title: "EARN REWARDS \n(COMING SOON) ",
    text: "Earn R coins (reward points) when you buy tickets and F&B coupons. ",
    img: "/images/three.png",
    meta: "/images/join-three.png",
  },
  {
    img: "/images/four.png",
    num: "04",
    title: "RIDE HOME \n(COMING SOON)",
    text: "Unlock your route and enjoy a safe, comfortable ride home after the party.",
    meta: "/images/join-four.png",
  },
];

const PICKUPS = [
  "Marina Bay Sands (Marquee / Avenue)",
  "CE LA VI",
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
  // Live tallies from Strapi. No user here, so nothing votes — see voteRoute.
  const { routes } = useRouteVoting();

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

  // Nobody is signed in on the public page, so a tap can't be counted here —
  // voting needs a membership record to spend the vote against. Send them to
  // the app, which is where ClubPass lives anyway.
  const voteRoute = () => {
    window.open(APP_LINK, "_blank", "noopener,noreferrer");
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
            <a
              className="cp-btn cp-btn-purple cp-btn-sm"
              href={APP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join the Club
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
                <a
                  className="cp-btn cp-btn-white"
                  href={APP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Become a Founding Member
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
              More ways to enjoy going out.
            </h2>
            <p>Clubpass brings together access, savings, rewards, and experiences — with more benefits rolling out as we grow.</p>
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

                    <div className="pl-item"><span>{item.text}</span> <span className={`${item.class}`}>{item.pill_text}</span></div>
                    
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



<section className="membership-section cp-container">
  <div className="status">AVAILABLE NOW</div>

  <h2>Your membership already gets you in.</h2>

  <div className="intro">
    Enjoy <strong>FREE ENTRY</strong> at selected Clubpass partner venues and events —
    included with your membership
  </div>

  <div className="benefits">
    <div className="benefit">
      <span className="cpn-mark cpn-mark--check">
                    <Check size={13} strokeWidth={3} />
                  </span>
      <span>Included from day one</span>
    </div>
    <div className="benefit">
      <span className="cpn-mark cpn-mark--check">
                    <Check size={13} strokeWidth={3} />
                  </span>
      <span>No additional entry fee</span>
    </div>
    <div className="benefit">
     <span className="cpn-mark cpn-mark--check">
                    <Check size={13} strokeWidth={3} />
                  </span>
      <span>One night out could already cover your membership</span>
    </div>
  </div>

  <div className="venue-grid">

    <article className="venue">
      <div className="venue-image">
        <img src="/images/free-one.png"/>
        <span className="venue-lock"><img src="/images/floating-badge.svg"/></span>
      </div>
      <div className="venue-name">Emporium</div>
      <div className="tag"><span className="tag-icon"><img src="/images/Vector.svg"/></span> FREE ENTRY</div>
      <div className="members">Clubpass Members</div>
      <div className="details"><span>View event details</span><span className="arrow"><img src="/images/mam-arrow.svg"/></span></div>
    </article>

    <article className="venue">
      <div className="venue-image">
         <img src="/images/free-two.png"/>
        <span className="venue-lock"><img src="/images/floating-badge.svg"/></span>
      </div>
      <div className="venue-name">Zouk</div>
      <div className="tag"><span className="tag-icon"><img src="/images/Vector.svg"/></span> FREE ENTRY</div>
      <div className="members">Clubpass Members</div>
      <div className="details"><span>View event details</span><span className="arrow"><img src="/images/mam-arrow.svg"/></span></div>
    </article>

    <article className="venue">
      <div className="venue-image">
        <img src="/images/free-three.png"/>
        <span className="venue-lock"><img src="/images/floating-badge.svg"/></span>
      </div>
      <div className="venue-name">Marquee Singapore</div>
      <div className="tag"><span className="tag-icon"><img src="/images/Vector.svg"/></span> FREE ENTRY</div>
      <div className="members">Clubpass Members</div>
      <div className="details"><span>View event details</span><span className="arrow"><img src="/images/mam-arrow.svg"/></span></div>
    </article>

    <article className="venue">
      <div className="venue-image">
        <img src="/images/free-four.png"/>
        <span className="venue-lock"><img src="/images/floating-badge.svg"/></span>
      </div>
      <div className="venue-name">Kilo Lounge</div>
      <div className="tag"><span className="tag-icon"><img src="/images/Vector.svg"/></span> FREE ENTRY</div>
      <div className="members">Clubpass Members</div>
      <div className="details"><span>View event details</span><span className="arrow"><img src="/images/mam-arrow.svg"/></span></div>
    </article>

    <article className="coming">
      <div className="plus">+</div>
      <strong>More partners coming soon</strong>
      <span>New venues and events added<br/>regularly.</span>
    </article>

  </div>

  <div className="info">
    <div className="info-item">
      <div className="info-icon"><img src="/images/gift.svg"/></div>
      
      <div>
        <div className="info-title">Free entry is included is with your Clubpass membership.</div>
        <div className="info-copy">Join for <b>S$17.90/month</b> and start enjoying participating venues and events now.</div>
      </div>
    </div>

    <div className="info-divider"></div>

    <div className="info-item">
      <div className="info-icon"><img src="/images/users.svg"/></div>
      <div>
        <div className="info-title">More venues. More events. More perks.</div>
        <div className="info-copy">We're adding new partners and member benefits all the time — stay tuned!</div>
      </div>
    </div>
  </div>

  <div className="terms">
    Free entry is subject to venue terms and conditions. Specific events and dates may apply.
  </div>
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
            <p className="cpn-kicker cpn-kicker--orange">
              CLUBPASS BETA
            </p>

            <h2 className="cpn-h2">
             Be a founding member.<br/> 
Help shape the future of Clubpass.

            </h2>

            <p className="cpn-membership-lead">
              Limited to 150 founding members only.<br/> 
Join the beta program, lock in the founder price and get exclusive launch rewards. 
            </p>
              <ul className="col-mb-list">
                <li>
                  <img src="/images/cb-one.png"/>
                  <p>Founder price locked in</p>
                </li>
                <li>
                  <img src="/images/cb-two.png"/>
                  <p>Exclusive launch rewards</p>
                </li>
                <li>
                  <img src="/images/cb-three.png"/>
                  <p>Limited to 150 members</p>
                  </li>
                <li>
                  <img src="/images/cb-four.png"/>
                  <p>Cancel anytime, no lock-in</p>
                  </li>
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
                <span>Clubpass</span>
                <span>BETA</span>
              </div>

              <div className="cpn-ticket-body">
                <div className="cpn-price">
                  FOUNDER
                 
                </div>

                <p className="cpn-ticket-note">
                  Limited to first 150 members.
                </p>
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
                  <span className="ticket-price">SGD $17.90/month <br/>
<p>(U.P. S$24.90)</p></span>
<span className="ticket-active">Active</span>
                </dl>

                <a
                  className="cpn-btn cpn-btn--white"
                  href={APP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Become a founding member
                </a>

                <p className="cpn-ticket-fine">
                  Auto-renewed at founder rate. Cancel anytime.
                </p>
              </div>
            </div>
            <div className="locked-text">
            <img src="/images/lock.svg"/>
            <p>Rate locked for 12 months</p>
            </div>
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
                <p className="cp-eyebrow">how it works</p>

                <h2 className="cp-h2">
                 Join the club.<br/>
Enjoy perks that keep growing.
                </h2>

                <p className="cp-note">
                  Clubpass is your pass to exclusive access, rewards and experiences — with more benefits on the way.
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

                  <h3 className="step-title">
  {step.title.split("\n").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < step.title.split("\n").length - 1 && <br />}
    </React.Fragment>
  ))}
</h3>

                  <p>{step.text}</p>

                  <span className="cp-step-meta">
                    <img src={step.meta}/>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

         {/* ================= rewards-section ================= */}

        <section  className="cp-section  rewards-section" >
          <div className="cp-container">
            <div className="cp-split-head">
              <div className="cp-work-text">
                <p className="cp-eyebrow">CLUBPASS REWARDS<span className="rewards-coming">COMING SOON</span></p>
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

    <div className="route-item easties active">

        <div className="route-header" onclick="toggleAccordion(this)">

            <div className="route-left">
                <div className="route-title-row">
                    <div className="route-title">EASTIES</div>
                    <div className="route-route">— EAST ROUTE</div>
                </div>

                <div className="route-description">
                    Traveling towards the East.
                </div>
            </div>

            <div className="progress-area">
                <div className="progress-top">
                    <div>
                        <span className="progress-number">137</span>
                        <span className="progress-total">/ 200</span>
                    </div>
                </div>

                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>

            <div className="unlock">
                <strong>63 more to unlock</strong>
                <span>Active Campaign</span>
            </div>

            <div className="toggle">−</div>

        </div>


        <div className="route-content">

            <div className="route-content-inner">


                <div className="dropoff">

                    <div className="dropoff-title">
                        DROP-OFF POINTS (EAST)
                    </div>

                    <ul className="dropoff-list">
                        <li>Paya Lebar MRT</li>
                        <li>Bedok MRT</li>
                        <li>Tampines MRT</li>
                        <li>Pasir Ris MRT</li>
                    </ul>

                    <a href="#" className="route-link">
                        View route map <img src="/images/route.png"/>
                    </a>

                </div>


  
                <div className="map-box">

                    <div className="map-line"></div>

                    <div className="map-point point-1"></div>
                    <div className="map-point point-2"></div>
                    <div className="map-point point-3"></div>
                    <div className="map-point point-4"></div>
                    <div className="map-point point-5"></div>

                    <div className="map-highlight">
                        Tampines MRT
                    </div>

                    <div className="map-label label-1">
                        Paya Lebar MRT
                    </div>

                    <div className="map-label label-2">
                        Bedok MRT
                    </div>

                    <div className="map-label label-3">
                        Tampines MRT
                    </div>

                    <div className="map-label label-4">
                        Tampines MRT
                    </div>

                    <div className="map-label label-5">
                        Pasir Ris
                    </div>

                    {/* <div className="map-location location-1">♧</div> */}
                    <div className="map-location location-2"><img src="/images/map-pin.png"/></div>
                    <div className="map-location location-3"><img src="/images/map-pin.png"/></div>

                </div>


 
                <div className="vote-box">

                    <div className="vote-title">
                        EASTIES, WE NEED YOU!
                    </div>

                    <div className="vote-icon">
                        ♡
                    </div>

                    <a href="#" className="vote-button">
                        Vote for East
                    </a>

                    <div className="vote-description">
                        Free account required<br/>
                        No membership needed
                    </div>

                </div>

            </div>

        </div>

    </div>


    <div className="route-item westies">

        <div className="route-header" onclick="toggleAccordion(this)">

            <div className="route-left">
                <div className="route-title-row">
                    <div className="route-title">WESTIES</div>
                    <div className="route-route">— WEST ROUTE</div>
                </div>

                <div className="route-description">
                    Traveling towards the West.
                </div>
            </div>

            <div className="progress-area">
                <div className="progress-top">
                    <div>
                        <span className="progress-number">84</span>
                        <span className="progress-total">/ 200</span>
                    </div>
                </div>

                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>

            <div className="unlock">
                <strong>116 more to unlock</strong>
                <span>Active Campaign</span>
            </div>

            <div className="toggle">+</div>

        </div>

        <div className="route-content">
            <div className="route-content-inner">
                <div className="dropoff">
                    <div className="dropoff-title">DROP-OFF POINTS (WEST)</div>
                    <ul className="dropoff-list">
                        <li>Jurong East MRT</li>
                        <li>West Coast</li>
                        <li>Clementi MRT</li>
                        <li>Buona Vista MRT</li>
                    </ul>
                    <a href="#" className="route-link">View route map 🗺</a>
                </div>

                <div className="map-box">
                    <div className="map-line"></div>
                    <div className="map-point point-1"></div>
                    <div className="map-point point-2"></div>
                    <div className="map-point point-3"></div>
                    <div className="map-point point-4"></div>
                    <div className="map-point point-5"></div>
                </div>

                <div className="vote-box">
                    <div className="vote-title">WESTIES, WE NEED YOU!</div>
                    <div className="vote-icon">♡</div>
                    <a href="#" className="vote-button">Vote for West</a>
                    <div className="vote-description">
                        Free account required<br/>
                        No membership needed
                    </div>
                </div>
            </div>
        </div>

    </div>



    <div className="route-item north-easties">

        <div className="route-header" onclick="toggleAccordion(this)">

            <div className="route-left">
                <div className="route-title-row">
                    <div className="route-title">NORTH EASTIES</div>
                    <div className="route-route">— NORTH EAST ROUTE</div>
                </div>

                <div className="route-description">
                    Traveling towards the North East.
                </div>
            </div>

            <div className="progress-area">
                <div className="progress-top">
                    <div>
                        <span className="progress-number">126</span>
                        <span className="progress-total">/ 200</span>
                    </div>
                </div>

                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>

            <div className="unlock">
                <strong>74 more to unlock</strong>
                <span>Active Campaign</span>
            </div>

            <div className="toggle">+</div>

        </div>

        <div className="route-content">
            <div className="route-content-inner">
                <div className="dropoff">
                    <div className="dropoff-title">DROP-OFF POINTS</div>
                    <ul className="dropoff-list">
                        <li>Serangoon MRT</li>
                        <li>Hougang MRT</li>
                        <li>Sengkang MRT</li>
                        <li>Punggol MRT</li>
                    </ul>
                    <a href="#" className="route-link">View route map 🗺</a>
                </div>

                <div className="map-box">
                    <div className="map-line"></div>
                    <div className="map-point point-1"></div>
                    <div className="map-point point-2"></div>
                    <div className="map-point point-3"></div>
                    <div className="map-point point-4"></div>
                    <div className="map-point point-5"></div>
                </div>

                <div className="vote-box">
                    <div className="vote-title">NORTH EASTIES, WE NEED YOU!</div>
                    <div className="vote-icon">♡</div>
                    <a href="#" className="vote-button">Vote Now</a>
                    <div className="vote-description">
                        Free account required<br/>
                        No membership needed
                    </div>
                </div>
            </div>
        </div>

    </div>



    <div className="route-item north-westies">

        <div className="route-header" onclick="toggleAccordion(this)">

            <div className="route-left">
                <div className="route-title-row">
                    <div className="route-title">NORTH WESTIES</div>
                    <div className="route-route">— NORTH WEST ROUTE</div>
                </div>

                <div className="route-description">
                    Traveling towards the North West.
                </div>
            </div>

            <div className="progress-area">
                <div className="progress-top">
                    <div>
                        <span className="progress-number">61</span>
                        <span className="progress-total">/ 200</span>
                    </div>
                </div>

                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>

            <div className="unlock">
                <strong>139 more to unlock</strong>
                <span>Active Campaign</span>
            </div>

            <div className="toggle">+</div>

        </div>

        <div className="route-content">
            <div className="route-content-inner">
                <div className="dropoff">
                    <div className="dropoff-title">DROP-OFF POINTS</div>
                    <ul className="dropoff-list">
                        <li>Bukit Batok MRT</li>
                        <li>Choa Chu Kang MRT</li>
                        <li>Bukit Panjang MRT</li>
                        <li>Woodlands MRT</li>
                    </ul>
                    <a href="#" className="route-link">View route map 🗺</a>
                </div>

                <div className="map-box">
                    <div className="map-line"></div>
                    <div className="map-point point-1"></div>
                    <div className="map-point point-2"></div>
                    <div className="map-point point-3"></div>
                    <div className="map-point point-4"></div>
                    <div className="map-point point-5"></div>
                </div>

                <div className="vote-box">
                    <div className="vote-title">NORTH WESTIES, WE NEED YOU!</div>
                    <div className="vote-icon">♡</div>
                    <a href="#" className="vote-button">Vote Now</a>
                    <div className="vote-description">
                        Free account required<br/>
                        No membership needed
                    </div>
                </div>
            </div>
        </div>

    </div>

</div>
          </div>
        </section>

 
      </div>

    

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

