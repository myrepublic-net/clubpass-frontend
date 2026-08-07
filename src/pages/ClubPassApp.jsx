import { useState } from "react";
import { Plus } from "lucide-react";

import "../css/clubpass-app.css";

const APP_LINK = "https://rewardland.onelink.me/EwIe/start";
const SITE = "https://www.rewardland.sg";

const STATS = [
  { value: "S$0", label: "surge fees, ever" },
  { value: "4", label: "nights every month" },
  { value: "5", label: "city pick-up stops" },
];

const CHIPS = ["4 nights / month", "Fixed schedule", "Late-night departures"];

const VOTE_ROUTES = [
  { id: "west", name: "West Route", sub: "18 more members needed", cta: "I want this", done: "Counted" },
  { id: "north", name: "North Route", sub: "26 more members needed", cta: "I want this", done: "Counted" },
  { id: "south", name: "South Route", sub: "Coming soon", cta: "Notify me", done: "You're on it" },
];

const STEPS = [
  { title: "Subscribe", text: "Secure PayPal checkout — takes a minute." },
  { title: "Get your QR pass", text: "Appears instantly in your RewardLand app." },
  { title: "Ride home", text: "Show the driver, board, relax." },
];

const PRICE_INCLUDES = [
  "4 operating nights every month",
  "All 5 city pick-up points",
  "Express drop-offs across the East",
  "Founder status & launch rewards",
];

const TRUST = [
  { title: "Members-only boarding", text: "Every rider is QR-verified. No walk-ons." },
  { title: "Licensed operators", text: "Professional drivers, full-size coaches." },
  { title: "On the dot", text: 'Fixed departures — never "when it fills up".' },
  { title: "Ride with your crew", text: "Same coach, seats together." },
];

const FAQS = [
  {
    q: "How many rides do I get?",
    a: "Four operating nights every month — one night a week, every week. Departure times are published in the RewardLand app ahead of each night.",
  },
  {
    q: "How do I board?",
    a: "Your boarding QR appears in the app the moment you subscribe. Show it to the driver at any city pick-up stop, take a seat, and you're set.",
  },
  {
    q: "How does billing work?",
    a: "S$19.90 is charged monthly through secure PayPal checkout and renews automatically. Cancel in two taps from your membership screen — no lock-in, no cancellation fee.",
  },
  {
    q: "My area isn't covered yet?",
    a: "Tap \"I want this\" on West or North, or \"Notify me\" for South. Each route launches once enough members register interest, and Founders board first.",
  },
];

/** Stylised East Route map — city pick-up cluster to eastern MRT drop-offs. */
function RouteMap() {
  return (
    <div
      className="cpm-map"
      role="img"
      aria-label="Map of the East Route: city pick-up loop through the club district with express drop-offs at Paya Lebar, Bedok, Tampines and Pasir Ris MRT"
    >
      <img src="/images/route-map.png"/>
    </div>
  );
}

export default function ClubPassApp() {
  const [openFaq, setOpenFaq] = useState(null);
  const [voted, setVoted] = useState([]);

  const toggleFaq = (index) => setOpenFaq((prev) => (prev === index ? null : index));
  const vote = (id) => setVoted((prev) => (prev.includes(id) ? prev : [...prev, id]));

  return (
    <div className="clubpass-app-page">
      {/* React 19 hoists these into <head> — no Helmet needed. */}
      <title>ClubPass Home Express | RewardLand</title>
      <meta
        name="description"
        content="Late-night coaches from the club district straight to the East. S$19.90/month, no surge, cancel anytime — inside the RewardLand app."
      />
      <meta name="theme-color" content="#14061F" />

      <div className="cpm-shell">
        {/* ================= Hero ================= */}
        <section className="cpm-hero">
          <span className="cpm-tag">ClubPass · Home Express</span>

          <h1>
            The night is yours.
            <br />
            <span>The ride home is ours.</span>
          </h1>

          <p className="cpm-hero-text">
            Late-night coaches from the club district straight to the East — for less than one surge
            ride.
          </p>

          <a
            className="cpm-btn cpm-btn-white cpm-btn-lg"
            href={APP_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            Subscribe now — S$19.90/month
          </a>

          <ul className="cpm-hero-notes">
            <li>
              <span className="cpm-live-dot" />
              East Route live
            </li>
            <li>No surge</li>
            <li>Cancel anytime</li>
          </ul>
        </section>

        {/* ================= Stats ================= */}
        <div className="cpm-pad cpm-stats">
          {STATS.map((stat) => (
            <div className="cpm-stat" key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ================= East Route ================= */}
        <section className="cpm-pad cpm-section">
          <div className="cpm-row-head">
            <h2 className="cpm-h2">East Route</h2>
            <span className="cpm-pill-live">
              <i />
              Live now
            </span>
          </div>

          <RouteMap />

          <div className="cpm-card">
            <div className="cpm-route-body">
              <div className="cpm-leg cpm-leg--pick">
                <h3>City pick-up loop · 5 stops</h3>
                <p>MBS · CÉ LA VI · Clarke Quay · Boat Quay · Zouk</p>
              </div>

              <div className="cpm-leg cpm-leg--drop">
                <h3>Express drop-offs · East</h3>
                <p>Paya Lebar · Bedok · Tampines · Pasir Ris*</p>
              </div>

              <div className="cpm-chips">
                {CHIPS.map((chip) => (
                  <span className="cpm-chip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= Other routes ================= */}
        <section className="cpm-pad" style={{ paddingBottom: 36 }}>
          <div className="cpm-panel">
            <h2>Not in the East?</h2>
            <p>
              New routes launch when enough members register interest. One tap — Founders board
              first.
            </p>

            <div className="cpm-vote-list">
              {VOTE_ROUTES.map((route) => {
                const isVoted = voted.includes(route.id);
                return (
                  <div className="cpm-vote" key={route.id}>
                    <div>
                      <h3>{route.name}</h3>
                      <small>{route.sub}</small>
                    </div>
                    <button
                      type="button"
                      className="cpm-btn cpm-btn-purple cpm-btn-sm"
                      onClick={() => vote(route.id)}
                      disabled={isVoted}
                    >
                      {isVoted ? route.done : route.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= How it works ================= */}
        <section className="cpm-pad" style={{ paddingBottom: 30 }}>
          <h2 className="cpm-h2">How it works</h2>

          <div className="cpm-steps">
            {STEPS.map((step, index) => (
              <div className="cpm-step" key={step.title}>
                <span className="cpm-step-num">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= Price card ================= */}
        <section className="cpm-pad cpm-price-wrap">
          <div className="card-m">
          <div className="cpm-price">
            <div className="cpm-price-head">
              <span>ClubPass · Home Express</span>
              <span className="cpm-price-badge">R</span>
            </div>

            <div className="cpm-price-amount">
              <b>S$19.90</b>
              <i>/month</i>
            </div>

            <p className="cpm-price-note">
              Founder launch price · first 150 members only. Locked in while you stay subscribed.
            </p>
<div className="cpm-perf" />
           </div>
         
            <div className="cp-dt"> 
           

            <ul className="cpm-price-list">
              {PRICE_INCLUDES.map((item) => (
                <li key={item}>
                  <span className="cpm-tick">
                    <img src="/images/tick.svg"/>
                    {/* <Check size={10} strokeWidth={3.5} /> */}
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              className="cpm-btn cpm-btn-white cpm-btn-lg"
              href={APP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe now
            </a>

            <p className="cpm-price-fine">
              Secure PayPal checkout · Auto-renews monthly · Cancel anytime
            </p>
          </div>
           </div>
        </section>

        {/* ================= Trust ================= */}
        <section className="cpm-trust">
          <h2>
            Planned like transit.
            <br />
            Protected like a members' club.
          </h2>

          <div className="cpm-trust-grid">
            {TRUST.map((card) => (
              <div className="cpm-tc" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= Quick answers ================= */}
        <section className="cpm-pad cpm-section">
          <h2 className="cpm-h2">Quick answers</h2>

          <div className="cpm-acc">
            {FAQS.map((faq, index) => (
              <div className={`cpm-acc-item${openFaq === index ? " is-open" : ""}`} key={faq.q}>
                <button
                  type="button"
                  className="cpm-acc-btn"
                  aria-expanded={openFaq === index}
                  onClick={() => toggleFaq(index)}
                >
                  {faq.q}
                  <Plus size={16} />
                </button>
                <div className="cpm-acc-panel">
                  <div>
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= Footer ================= */}
        <footer className="cpm-footer">
          ClubPass by RewardLand
          <i>·</i>
          <a href={`${SITE}/terms-and-conditions`}>Terms of Use</a>
          <i>·</i>
          <a href={`${SITE}/privacy-policy`}>Privacy Policy</a>
          
        </footer>
        <div className=" cpm-pad bt-stciky-btn">
          <a className="bt-btn cpm-btn cpm-btn-white cpm-btn-lg" href="https://rewardland.onelink.me/EwIe/start" target="_blank" rel="noopener noreferrer"><span>Subscribe now</span><span>S$19.90/mo</span></a>
      </div>
      </div>
    </div>
  );
}



