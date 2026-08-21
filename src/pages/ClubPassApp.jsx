import { useState } from "react";
import { Plus } from "lucide-react";

import MemberDashboard from "../components/MemberDashboard.jsx";
import SubscribeModal from "../components/SubscribeModal.jsx";
import { useClubpassUser } from "../components/clubpassUserContext.js";
import { isPaid } from "../api/clubpassUser.js";
import "../css/clubpass-app.css";

const SITE = "https://www.rewardland.sg";

const STATS = [
  { value: "SGD $0", label: "surge fees, ever" },
  { value: "4", label: "nights every month" },
  { value: "5", label: "city pick-up stops" },
];

const CHIPS = ["4 nights / month", "Fixed schedule", "Late-night departures"];

const VOTE_ROUTES = [
  { id: "west", name: "West Route", sub: "18 more members needed", cta: "I want this", done: "Counted" },
  { id: "north", name: "North Route", sub: "26 more members needed", cta: "I want this", done: "Counted" },
  { id: "south", name: "South Route", sub: "26 more members needed", cta: "Notify me", done: "You're on it" },
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
      <img src="/images/route-m.png"/>
    </div>
  );
}

export default function ClubPassApp() {
  const [openFaq, setOpenFaq] = useState(null);
  const [voted, setVoted] = useState([]);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  // Signed in through RewardLand SSO, so there is always a name to show.
  const { user, userName } = useClubpassUser();
  const paid = isPaid(user);

  const toggleFaq = (index) => setOpenFaq((prev) => (prev === index ? null : index));
  const vote = (id) => setVoted((prev) => (prev.includes(id) ? prev : [...prev, id]));

  // Once they've paid, the sales page has nothing left to say — this is their
  // dashboard from then on. SubscribeModal stays mounted so a cancelled member
  // can restart from inside it.
  if (paid) {
    return (
      <>
        <MemberDashboard onRestart={() => setSubscribeOpen(true)} />
        <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
      </>
    );
  }

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
        {/* ================= Who's signed in ================= */}
        <header className="cpm-topbar">
          <div className="mb-logo"><img src="/images/cb-app-logo.png"/></div>
           <div className="mb-user">
          <span className="cpm-topbar-avatar" aria-hidden="true">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <span className="cpm-topbar-name">{userName}</span>
          </div>
        </header>

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

          {paid ? null : (
            <button
              type="button"
              className="cpm-btn cpm-btn-white cpm-btn-lg"
              onClick={() => setSubscribeOpen(true)}
            >
              Subscribe Now — SGD $19.90/mth 
            </button>
          )}

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
        <section className="cpm-pad cpm-section cpm-route-section" >
          <div className="cpm-row-head">
            <h2 className="cpm-h2">East Route</h2>
            <span className="cpm-pill-live">
              <i />
              Live now
            </span>
          </div>
          <div className="cust-map">
          <RouteMap />

          <div className="cpm-card">
            <div className="cpm-route-body">
              <div className="cpm-route-time">
                  <img src="/images/cp-time.png"/>
                  <h5>Every Saturday • 2:30 AM Departure from First Pickup</h5>
              </div>
               <div class="pickup-card">

    <h2 class="pickup-title">
      Pick-Up Stops (City Loop) <span>• 5 Stops</span>
    </h2>

    <div class="pickup-list">

      <div class="pickup-stop">
        <div class="stop-number">1</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">Marina Bay Sands</div>
            <div class="stop-time">2.30 AM</div>
          </div>
          <div class="stop-address">Bayfront Avenue</div>
        </div>
      </div>

      <div class="pickup-stop">
        <div class="stop-number">2</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">CÉ LA VI</div>
            <div class="stop-time">2.40 AM</div>
          </div>
          <div class="stop-address">Bayfront Avenue</div>
        </div>
      </div>

      <div class="pickup-stop">
        <div class="stop-number">3</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">Clarke Quay</div>
            <div class="stop-time">2.50 AM</div>
          </div>
          <div class="stop-address">River Valley Rd</div>
        </div>
      </div>

      <div class="pickup-stop">
        <div class="stop-number">4</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">Boat Quay</div>
            <div class="stop-time">3.00 AM</div>
          </div>
          <div class="stop-address">South Bridge Rd</div>
        </div>
      </div>

      <div class="pickup-stop">
        <div class="stop-number">5</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">Zouk</div>
            <div class="stop-time">3.10 AM</div>
          </div>
          <div class="stop-address">3C River Valley Rd</div>
        </div>
      </div>

    </div>
  </div>

  <div class="pickup-card drop-off">

    <h2 class="pickup-title">
      Express Drop-Offs  <span>• East</span>
    </h2>

    <div class="pickup-list">

      <div class="pickup-stop">
        <div class="stop-number">1</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">Paya Lebar MRT</div>
            <div class="stop-time">3.40 AM</div>
          </div>
          <div class="stop-address">Exit B</div>
        </div>
      </div>

      <div class="pickup-stop">
        <div class="stop-number">2</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">Bedok MRT</div>
            <div class="stop-time">3.55 AM</div>
          </div>
          <div class="stop-address">Exit A</div>
        </div>
      </div>

      <div class="pickup-stop">
        <div class="stop-number">3</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">Tampines MRT</div>
            <div class="stop-time">4.05 AM</div>
          </div>
          <div class="stop-address">Exit D</div>
        </div>
      </div>

      <div class="pickup-stop">
        <div class="stop-number">4</div>

        <div class="stop-content">
          <div class="stop-main">
            <div class="stop-name">Pasir Ris MRT</div>
            <div class="stop-time">4.20 AM</div>
          </div>
          <div class="stop-address">Exit A</div>
        </div>
      </div>

    </div>
  </div>
  <div className="time-note"><img src="/images/cp-note.png"/><span>Times may vary depending on traffic conditions.</span></div>
              {/* <div className="cpm-leg cpm-leg--pick">
                <h3>City pick-up loop · 5 stops</h3>
                <p>MBS · CÉ LA VI · Clarke Quay · Boat Quay · Zouk</p>
              </div>

              <div className="cpm-leg cpm-leg--drop">
                <h3>Express drop-offs · East</h3>
                <p>Paya Lebar · Bedok · Tampines · Pasir Ris*</p>
              </div> */}

              <div className="cpm-chips">
                {CHIPS.map((chip) => (
                  <span className="cpm-chip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
          </div>
        </section>
<div class="cpm-gradient">
        {/* ================= Other routes ================= */}
        <section className="cpm-pad" style={{ paddingBottom: 50 }}>
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
        <section className="cpm-pad" style={{ paddingBottom: 60 }}>
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
          <div className="cpm-price-head">
                <span>ClubPass · Home Express</span>
              </div>
          <div className="card-m mb-card-in">
            <div className="cpm-price">
              <img className="only-image" src="/images/only.png"/>
              <div className="cpm-price-amount">
                <b>SGD $19.90</b>
                <i>/mth</i>
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
                      <img src="/images/mb-check.svg"/>
                      {/* <Check size={10} strokeWidth={3.5} /> */}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="cpm-btn cpm-btn-white cpm-btn-lg"
                onClick={() => setSubscribeOpen(true)}
                disabled={paid}
              >
                {paid ? "Subscription active" : "Subscribe now"}
              </button>
              <p className="cpm-price-fine">
                {paid
                  ? "Renews monthly · Cancel anytime from your membership screen"
                  : "Auto-renews monthly. Cancel anytime."}
              </p>
              <p className="cpm-price-fine">T&Cs apply</p>
            </div>
          </div>
        </section>

        {/* ================= Trust ================= */}
       <section className="cpm-trust">
  <div className="cpm-trust-header">
    <h2> Planned like transit.<br />Protected like a members' club.</h2>
    <img src="/images/cpn/skater-m.png" />
  </div>
  <div class="cpn-safety-top mb-safety">
    <div className="cpn-nights">
      <img alt="4" src="/images/cpn/mb-four.png" />
      <div className="cpn-nights-text">
        <h3>nights a month - one night a week, every week</h3>
        <hr />
        <p>Scheduled rides. Live bus tracking. No surge pricing. Check departure times and follow your bus in real time
          through the app.</p>
      </div>
    </div>
  </div>
<div className="cpn-safety-grid mb-safety-grid">
    <div className="cpn-safety-card"><span className="cpn-safety-icon"><img src="/images/cp-clock.png"/></span>
        <h3>On the dot</h3>
        <p>Fixed departures — never "when it fills up".</p>
    </div>
    <div className="cpn-safety-card"><span className="cpn-safety-icon"><img src="/images/cp-card.png"/></span>
        <h3>Licensed operators</h3>
        <p>Professional drivers, full-size coaches.</p>
    </div>
    <div className="cpn-safety-card"><span className="cpn-safety-icon"><img src="/images/cp-flower.png"/></span>
        <h3>Members-only boarding</h3>
        <p>Every rider QR-verified. No walk-ons.</p>
    </div>
    
    <div className="cpn-safety-card"><span className="cpn-safety-icon"><img src="/images/rl-icon.png"/></span>
        <h3>Ride with your crew</h3>
        <p>Same coach, seats together.</p>
    </div>
</div>
  {/* <div className="cpm-trust-grid">
    {TRUST.map((card) => (
    <div className="cpm-tc" key={card.title}>
      <h3>{card.title}</h3>
      <p>{card.text}</p>
    </div>
    ))}
  </div> */}
</section>

        {/* ================= Quick answers ================= */}
        <section className="cpm-pad cpm-section cpm-acc-section">
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
</div>
        {/* ================= Footer ================= */}
        <footer className="cpm-footer">
          ClubPass by RewardLand
          <i>·</i>
          <a href={`${SITE}/terms-and-conditions`}>Terms of Use</a>
          <i>·</i>
          <a href={`${SITE}/privacy-policy`}>Privacy Policy</a>
          
        </footer>
        {!paid && (
          <div className=" cpm-pad bt-stciky-btn">
            <button type="button" className="bt-btn cpm-btn cpm-btn-white cpm-btn-lg" onClick={() => setSubscribeOpen(true)}><span>Subscribe now</span><span>S$19.90/mo</span></button>
          </div>
        )}
      </div>

      <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
    </div>
  );
}



