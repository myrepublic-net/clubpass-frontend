import { useState } from "react";
import { ChevronDown } from "lucide-react";

import LegalPage from "../components/LegalPage.jsx";

const SUPPORT_EMAIL = "clubpass@rewardland.sg";

/*
 * Each answer is a list of paragraphs. A paragraph is usually a string; the one
 * that needs a link is JSX.
 */
const GROUPS = [
  {
    id: "account",
    title: "Account & Membership",
    items: [
      {
        q: "What is Clubpass?",
        a: [
          "Clubpass by Reward Land is a membership that gives you more from the things you love — with exclusive perks, special rates, member benefits, and experiences across participating events, venues, and partners.",
        ],
      },
      {
        q: "What benefits do I get with a Clubpass membership?",
        a: [
          "Clubpass is starting with nightlife, giving Members access to perks such as free access to select events and venues, special member ticket prices, R Coins on ticket and F&B coupon purchases, and access to Clubpass Home Express, our late-night shuttle service.",
          "And this is just the beginning — more benefits, experiences, and partners will be added over time. Keep an eye on Clubpass for the latest perks!",
        ],
      },
      {
        q: "How much does Clubpass membership cost?",
        a: [
          "Clubpass is currently available at a Founding Member Price of S$17.90/month (U.P. S$24.90/month). Join as a Founding Member and enjoy this special rate, locked in for 12 months.",
        ],
      },
      {
        q: "Do I need to create an account or download an app?",
        a: [
          "You can log in using your Reward Land account. If you don’t have one, you can create a Clubpass account through our website to sign up for a membership and access your Clubpass benefits.",
          "Once you're signed in, you'll be able to manage your membership and access eligible Clubpass benefits.",
        ],
      },
      {
        q: "How does billing and cancellation work?",
        a: [
          "Clubpass is a monthly subscription that renews automatically using your selected payment method. You can manage or cancel your membership anytime through the Clubpass website.",
          "If you cancel, your membership and benefits will remain active until the end of your current billing period.",
        ],
      },
      {
        q: "Can I get a refund if I cancel my membership?",
        a: [
          "Membership fees already paid are non-refundable, and you'll continue to enjoy your membership benefits until the end of your current billing period.",
        ],
      },
    ],
  },
  {
    id: "home-express",
    title: "Clubpass Home Express",
    items: [
      {
        q: "What is the Clubpass Home Express?",
        a: [
          "Clubpass Home Express is our late-night shuttle service that helps Clubpass members get closer to home after a night out.",
          "Instead of worrying about expensive late-night rides, simply head to one of our designated pick-up points and hop aboard an available route towards your area.",
        ],
      },
      {
        q: "How many rides can I take on Clubpass Home Express?",
        a: [
          "Eligible Clubpass Members can enjoy Home Express rides as part of their membership whenever the service is running, subject to the available routes, schedule and service conditions.",
        ],
      },
      {
        q: "Do I need to reserve a seat on Clubpass Home Express?",
        a: [
          "Not for now. Simply arrive at the pick-up point and board, subject to seat availability.",
          "We expect to introduce seat reservations in the future, making it even easier to secure your seat before your ride.",
        ],
      },
      {
        q: "Where and when will Clubpass Home Express operate?",
        a: [
          "Clubpass Home Express will run on selected routes with designated pick-up and drop-off points. Routes, locations and schedules will be available on your Clubpass membership page once the service launches.",
          "Want Home Express in your area? Vote for your preferred route and help us decide where to go next.",
        ],
      },
      {
        q: "What happens if I'm late for my shuttle?",
        a: [
          "Please arrive at your designated pick-up point before the scheduled departure time.",
          "Our shuttles need to leave according to schedule and unfortunately cannot wait for late passengers. If you miss your shuttle, you'll need to make your own alternative transport arrangements.",
        ],
      },
      {
        q: "Can I board Clubpass Home Express if I've been drinking?",
        a: [
          "Of course! Clubpass Home Express is designed with nights out in mind. However, everyone needs to be able to travel safely and respectfully.",
          "If you're excessively intoxicated, aggressive, disruptive or behaving in a way that could affect the safety or experience of other passengers, our team or transport partners may refuse boarding.",
        ],
      },
      {
        q: "What happens if someone causes trouble on the bus?",
        a: [
          "We want Clubpass Home Express to be a comfortable experience for everyone.",
          "Aggressive, abusive, dangerous or disruptive behaviour isn't tolerated. Members who seriously or repeatedly disrupt the service may receive a warning or have their Clubpass Home Express access temporarily or permanently suspended, depending on the circumstances.",
        ],
      },
      {
        q: "Can I bring a friend who isn't a Clubpass member?",
        a: [
          "Clubpass Home Express is a member-only benefit, so passengers must meet the eligibility requirements for the relevant service.",
          "If your friend wants to ride with you, encourage them to join Clubpass too! 🎉",
        ],
      },
    ],
  },
  {
    id: "events",
    title: "Events, Rewards & Perks",
    items: [
      {
        q: "What kinds of events can I access through Clubpass?",
        a: [
          "Clubpass members can discover selected nightlife events, parties, venue experiences and other activities.",
          "Depending on the event, members may receive free entry, discounted tickets, exclusive prices or other Clubpass perks.",
        ],
      },
      {
        q: "Can I buy event tickets without being a Clubpass member?",
        a: [
          "Selected events may be available to both members and non-members.",
          "However, Clubpass members may receive better prices, exclusive benefits or special access on eligible events.",
        ],
      },
      {
        q: "Can I earn R Coins through Clubpass?",
        a: [
          "Yes! Selected Clubpass activities, purchases, and promotions may reward you with R Coins.",
          "R Coins can be redeemed within the Reward Land app for eligible rewards and redemptions (170+ brands), giving you another way to get more out of your nights with Clubpass.",
        ],
      },
      {
        q: "Where can I see the latest Clubpass benefits and offers?",
        a: [
          "Check Clubpass regularly for the latest events, Home Express routes, member offers, and new perks.",
          "We're continually working on adding new experiences and benefits, so there'll always be something new to look out for.",
        ],
      },
    ],
  },
  {
    id: "help",
    title: "Need Help?",
    items: [
      {
        q: "I have a question that isn't answered here. Who can I contact?",
        a: [
          "We're happy to help!",
          <>
            Reach out to the Clubpass team at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for assistance with your
            membership, Clubpass Home Express rides, events, or other Clubpass enquiries.
          </>,
        ],
      },
    ],
  },
];

/** Clubpass FAQs — same header, back button and footer as the legal pages. */
export default function Faq() {
  // One question open at a time, keyed "groupId:index". The first starts open.
  const [open, setOpen] = useState("account:0");

  return (
    <LegalPage title="Clubpass FAQs" pageTitle="Clubpass FAQs | RewardLand">
      <nav className="faq-groups" aria-label="FAQ categories">
        {GROUPS.map((group) => (
          <a key={group.id} href={`#${group.id}`} className="faq-chip">
            {group.title}
          </a>
        ))}
      </nav>

      {GROUPS.map((group) => (
        <section key={group.id} id={group.id} className="tc-section">
          <h2>{group.title}</h2>

          <div className="faq-list">
            {group.items.map((item, index) => {
              const key = `${group.id}:${index}`;
              const isOpen = open === key;

              return (
                <div key={key} className={`faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${key}`}
                    onClick={() => setOpen(isOpen ? null : key)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={20} className="faq-chevron" aria-hidden="true" />
                  </button>

                  {isOpen && (
                    <div id={`faq-${key}`} className="faq-answer">
                      {item.a.map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </LegalPage>
  );
}
