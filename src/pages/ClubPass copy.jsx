import { useState } from "react";
import { ArrowRight, Bell, Check, ChevronDown, Menu, X } from "lucide-react";

import "../css/clubpass.css";

const APP_LINK = "https://rewardland.onelink.me/EwIe/start";
const SITE = "https://www.rewardland.sg";

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
    num: "01",
    title: "Open RewardLand",
    text: "Download the app, or open it — if you're in, your account is already there.",
    meta: "30 seconds",
  },
  {
    num: "02",
    title: "Find ClubPass",
    text: "It lives right inside the app, next to your rewards wallet.",
    meta: "One tap",
  },
  {
    num: "03",
    title: "Subscribe",
    text: "Pick your membership and pay securely in-app. Cancel anytime.",
    meta: "S$19.90/month",
  },
  {
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

const DROPOFFS = ["Paya Lebar MRT", "Bedok MRT", "Tampines MRT", "Pasir Ris MRT*"];

const SAFETY_CARDS = [
  {
    icon: <img src="/images/members.png"/>,
    title: "Members-only boarding",
    text: "Every rider is QR-verified before stepping on. No strangers, no walk-ons.",
  },
  {
    icon: <img src="/images/op.png"/>,
    title: "Licensed operators",
    text: "Full-size, air-conditioned coaches with professional drivers — not ad-hoc rides found at 3am.",
  },
  {
    icon: <img src="/images/ride.png"/>,
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
    q: "What is ClubPass Home Express?",
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
    a: "No. ClubPass sits inside the RewardLand app you already have. If you're an existing user you're signed in automatically — no new account, no second app to download.",
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

/**
 * ClubPass mascot. Drop `public/images/clubpass-mascot.png` in to use the
 * ClubPass artwork; until then we fall back to the existing Flare mascot.
 */
function Mascot({ fallback }) {
  return (
    <img
      src="/images/clubpass-mascot.png"
      alt=""
      aria-hidden="true"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith(fallback)) img.src = fallback;
      }}
    />
  );
}

/** Stylised East Route map used in the routes card. */
function RouteMap() {
  return (
    <div className="cp-map" role="img" aria-label="Map of the East Route pick-up loop and express drop-offs">
      <img src="/images/map.png"/>
    </div>
  );
}

export default function ClubPass() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [votedRoutes, setVotedRoutes] = useState([]);

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const voteRoute = (route) => {
    setVotedRoutes((prev) => (prev.includes(route) ? prev : [...prev, route]));
  };

  return (
    <div className="clubpass-page">
      {/* React 19 hoists these into <head> — no Helmet needed. */}
      <title>ClubPass Home Express | RewardLand</title>
      <meta
        name="description"
        content="Singapore's first late-night coach membership. Scheduled departures from the club district straight to the East — S$19.90/month, no surge, cancel anytime."
      />

      {/* ================= Header ================= */}
      <header className="cp-header">
        <div className="cp-container cp-header-inner">
          <a className="cp-brand" href="#top">
            <span className="cp-brand-mark">R</span>
            <span className="cp-brand-name">reward<label className="cl-color">land</label></span>
            <span className="cp-brand-sub">ClubPass</span>
          </a>

          <nav className={`cp-nav${menuOpen ? " is-open" : ""}`}>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="d-flex align-items-center" style={{ gap: 8 }}>
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

      {/* ================= Hero ================= */}
      <section className="cp-hero" id="top">
        <div className="cp-hero-inner">
          <div className="cp-container">
            <div className="cp-hero-copy">
              <span className="cp-tag">ClubPass · Home Express by RewardLand</span>

              <h1>
                The night is yours.
                <br />
                <span className="cp-accent">The ride home is ours.</span> 
              </h1>

              <p className="cp-hero-text">
                Singapore's first late-night coach membership. Scheduled departures from the club
                district straight to the East — for less than one surge-hour ride.
              </p>

              <div className="cp-hero-actions">
                <a
                  className="cp-btn cp-btn-white"
                  href={APP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe — S$19.90/month
                </a>
                <a className="cp-btn cp-btn-ghost" href="#how-it-works">
                  See how it works
                </a>
              </div>

              <ul className="cp-hero-notes">
                <li>
                  <span className="cp-dot" />
                  East Route live
                </li>
                <li>
                  <span className="cp-dot" />
                  Fixed schedule, no surge
                </li>
                <li>
                  <span className="cp-dot" />
                  Cancel anytime
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="cp-hero-art">
          <Mascot fallback="/images/Flare-Jumping.png" />
        </div>
      </section>

      {/* ================= Why ClubPass ================= */}
      <section className="cp-section">
        <div className="cp-container">
          <div className="cp-why-head cp-center">
            <p className="cp-eyebrow">Why ClubPass</p>
            <h2 className="cp-h2">
              Getting home after 2am shouldn't be the hardest part of the night.
            </h2>
          </div>

          <div className="cp-compare">
            <div className="cp-card-plain">
              <p className="cp-card-label">Tonight, without ClubPass</p>
              <ul className="cp-list">
                {WITHOUT_CLUBPASS.map((item) => (
                  <li key={item}>
                    <span className="cp-ico cp-ico-x">
                      <X size={11} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cp-card-dark">
              <p className="cp-card-label">Tonight, with ClubPass</p>
              <ul className="cp-list">
                {WITH_CLUBPASS.map((item) => (
                  <li key={item}>
                    <span className="cp-ico cp-ico-check">
                      <Check size={11} strokeWidth={3} />
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
      <section className="cp-section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="cp-container">
          <div className="cp-split-head">
            <div>
              <p className="cp-eyebrow">How it works</p>
              <h2 className="cp-h2">From dance floor to doorstep</h2>
            </div>
            <p className="cp-note">
              Already a RewardLand user? You're signed in automatically — no new account, no new app.
            </p>
          </div>

          <div className="cp-steps">
            {STEPS.map((step) => (
              <div className="cp-step" key={step.num}>
                <div className="cp-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <span className="cp-step-meta">{step.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Routes ================= */}
      <section className="cp-section cp-routes" id="routes">
        <div className="cp-container">
          <div className="cp-routes-head cp-center">
            <p className="cp-eyebrow">Routes</p>
            <h2 className="cp-h2">One island. Four routes.</h2>
            <p className="cp-lead" style={{ marginTop: 14 }}>
              East is live today. West, North and South unlock as neighbours register interest — one
              vote per route, five seconds.
            </p>
          </div>

          <div className="cp-route-top">
            <div className="cp-route-card">
              <div className="cp-route-card-head">
                <h3>East Route</h3>
                <span className="cp-pill-live">
                  <i />
                  Live now
                </span>
              </div>

              <div className="cp-stops">
                <div className="cp-stops-col">
                  <h4>Pick-up loop · City</h4>
                  <ul>
                    {PICKUPS.map((stop) => (
                      <li key={stop}>
                        <span className="cp-stop-dot" />
                        {stop}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="cp-stops-col cp-stops-col--drop">
                  <h4>Express drop-off · East</h4>
                  <ul>
                    {DROPOFFS.map((stop) => (
                      <li key={stop}>
                        <span className="cp-stop-dot" />
                        {stop}
                      </li>
                    ))}
                  </ul>
                  <p className="cp-stops-note">*Subject to demand. Full timings in the app.</p>
                </div>
              </div>
            </div>

            <RouteMap />
          </div>

          <div className="cp-route-grid">
            <div className="cp-route-mini">
              <h3>West Route</h3>
              <div className="cp-route-count">18</div>
              <small>more voters needed</small>
              <div className="cp-progress">
                <span style={{ width: "64%" }} />
              </div>
              <button
                type="button"
                className="cp-btn cp-btn-purple cp-btn-sm cp-btn-block"
                onClick={() => voteRoute("west")}
                disabled={votedRoutes.includes("west")}
              >
                {votedRoutes.includes("west") ? "Vote counted" : "I want this route"}
              </button>
            </div>

            <div className="cp-route-mini">
              <h3>North Route</h3>
              <div className="cp-route-count">26</div>
              <small>more voters needed</small>
              <div className="cp-progress">
                <span style={{ width: "48%" }} />
              </div>
              <button
                type="button"
                className="cp-btn cp-btn-purple cp-btn-sm cp-btn-block"
                onClick={() => voteRoute("north")}
                disabled={votedRoutes.includes("north")}
              >
                {votedRoutes.includes("north") ? "Vote counted" : "I want this route"}
              </button>
            </div>

            <div className="cp-route-mini cp-route-mini--soon">
              <h3>South Route</h3>
              <p>Coming soon — be the first to know when voting opens.</p>
              <button
                type="button"
                className="cp-btn cp-btn-purple cp-btn-sm"
                onClick={() => voteRoute("south")}
                disabled={votedRoutes.includes("south")}
              >
                {votedRoutes.includes("south") ? (
                  "You're on the list"
                ) : (
                  <>
                    <Bell size={13} />
                    Notify me
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Schedule & safety ================= */}
      <section className="cp-section cp-safety">
        <div className="cp-container">
          <div className="cp-split-head">
            <div>
              <p className="cp-eyebrow cp-on-dark">Schedule &amp; safety</p>
              <h2 className="cp-h2">
                Planned like transit.
                <br />
                Protected like a members' club.
              </h2>
            </div>
            <p className="cp-note">
              Fixed nights, fixed stops, verified riders. Nothing about your ride home is left to
              chance.
            </p>
          </div>

          <div className="cp-safety-grid">
            <div className="cp-sc cp-sc-wide">
              <div className="cp-sc-big">4</div>
              <div>
                <h3>nights a month — one night a week, every week</h3>
                <p>
                  Departures are fixed and published ahead of time; exact timings live in the app.
                  Your price never changes — no surge, ever.
                </p>
              </div>
            </div>

            <div className="cp-sc">
              <span className="cp-sc-icon">
                <img src="/images/dot.png" />
              </span>
              <h3>On the dot</h3>
              <p>Departures run on the clock — never "when the bus fills up".</p>
            </div>
          </div>

          <div className="cp-safety-grid-3">
            {SAFETY_CARDS.map((card) => (
              <div className="cp-sc" key={card.title}>
                <span className="cp-sc-icon">{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Membership ================= */}
      <section className="cp-section" id="membership">
        <div className="cp-container">
          <div className="cp-member-grid">
            <div className="cp-member-copy">
              <p className="cp-eyebrow">Membership</p>
              <h2 className="cp-h2">
                One simple membership.
                <br />
                No surge maths.
              </h2>
              <p className="cp-lead">
                A single monthly subscription inside the RewardLand app. It renews automatically, and
                you can cancel in two taps — no lock-in, no hidden fees.
              </p>

              <ul className="cp-member-list">
                {MEMBER_BENEFITS.map((benefit) => (
                  <li key={benefit}>
                    <img src="/images/check.png" />
                    {/* <span className="cp-tick">
                      <Check size={10} strokeWidth={3.5} />
                    </span> */}
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
              <div className="card-m">
            <div className="cp-ticket">
              <div className="cp-ticket-head">
                <span>ClubPass · Home Express</span>
                <span className="cp-ticket-badge">R</span>
              </div>

              <div className="cp-price">
                <b>S$19.90</b>
                <i>/month</i>
              </div>

              <p className="cp-ticket-note">
                Founder launch price · First 150 members only. Locked in for as long as you stay
                subscribed.
              </p>

              
            </div>
            <div className="dt-card">
              <dl className="cp-ticket-stats">
                <div>
                  <dt>Status</dt>
                  <dd>Founder</dd>
                </div>
                <div>
                  <dt>Rides</dt>
                  <dd>4 nights / mo</dd>
                </div>
                <div>
                  <dt>Boarding</dt>
                  <dd>QR in app</dd>
                </div>
              </dl>

              <a
                className="cp-btn cp-btn-white cp-btn-block"
                href={APP_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe in RewardLand
              </a>

              <p className="cp-ticket-fine">Auto-renews monthly · Cancel anytime in the app</p>
              </div>
              </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="cp-section" id="faq" style={{ paddingTop: 0 }}>
        <div className="cp-container">
          <div className="cp-faq-grid">
            <div>
              <p className="cp-eyebrow">FAQ</p>
              <h2 className="cp-h2">
                Good questions,
                <br />
                straight answers
              </h2>
              <p className="cp-lead" style={{ fontSize: 15 }}>
                Anything we missed? Full details live in the RewardLand app.
              </p>
            </div>

            <div>
              {FAQS.map((faq, index) => (
                <div
                  className={`cp-acc-item${openFaq === index ? " is-open" : ""}`}
                  key={faq.q}
                >
                  <button
                    type="button"
                    className="cp-acc-btn"
                    aria-expanded={openFaq === index}
                    onClick={() => toggleFaq(index)}
                  >
                    {faq.q}
                    <ChevronDown size={16} />
                  </button>
                  <div className="cp-acc-panel">
                    <div>
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Final CTA ================= */}
      <section className="cp-cta-wrap">
        <div className="cp-container">
          <div className="cp-cta">
            <div className="cp-cta-mascot">
              <img src="/images/cat.png" />
            </div>

            <span className="cp-cta-bubble">I'll get you home safely! 💜</span>

            <h2>Be one of the first 150.</h2>
            <p>
              Founder pricing ends when the seats are gone. Lock in S$19.90/month and be part of
              ClubPass from night one.
            </p>

            <a
              className="cp-btn cp-btn-white"
              href={APP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open RewardLand
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ================= Footer ================= */}
      <footer className="cp-footer">
        <div className="cp-container cp-footer-inner">
          <div className="cp-brand">
            <span className="cp-brand-mark">R</span>
            <span className="cp-brand-name">reward<label className="cl-color">land</label></span>
            <span className="cp-footer-tag">Shop. Earn. Redeem. Repeat.</span>
          </div>

          <div className="cp-footer-links">
            <a href={SITE}>About RewardLand</a>
            <a href={`${SITE}/terms-and-conditions`}>Terms of Use</a>
            <a href={`${SITE}/privacy-policy`}>Privacy Policy</a>
            <a href={`${SITE}/contact`}>Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
