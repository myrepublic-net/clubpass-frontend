import LegalPage, { LegalBlocks } from "../components/LegalPage.jsx";

/** Shown under the title. Replace with the real date when the terms are published. */
const LAST_UPDATED = "[17-Sep-2026]";

/*
 * The terms as data, rendered by LegalBlocks (see components/LegalPage.jsx).
 */
const SECTIONS = [
  {
    id: "membership",
    title: "1. Clubpass Membership",
    blocks: [
      { clause: "1.1", text: "Clubpass membership is available to eligible users who successfully register for and, where applicable, pay the relevant membership fee." },
      { clause: "1.2", text: "Membership benefits may include access to Clubpass Home Express, events, venue privileges, member pricing, R Coins, promotions and other benefits made available from time to time." },
      { clause: "1.3", text: "Membership benefits, participating partners, promotions, routes, schedules and services may be added, amended, substituted or withdrawn from time to time." },
      { clause: "1.4", text: "Unless otherwise stated, membership benefits are personal to the registered member and may not be transferred, resold or shared with another person." },
      { clause: "1.5", text: "Members are responsible for ensuring that the information associated with their Clubpass account is accurate and up to date." },
    ],
  },
  {
    id: "home-express",
    title: "2. Clubpass Home Express",
    blocks: [
      {
        sub: "2.1 Eligibility to Board",
        blocks: [
          { p: "Clubpass Home Express is available to eligible Clubpass members, subject to availability and any booking, verification or boarding requirements communicated by Clubpass." },
          { p: "Members may be required to present a valid ticket, booking confirmation, membership details, QR code or other proof of eligibility before boarding." },
          { p: "We reserve the right to refuse boarding where a person cannot provide satisfactory proof of eligibility." },
        ],
      },
      {
        sub: "2.2 Seat Availability and Reservations",
        blocks: [
          { p: "Seats on Clubpass Home Express are limited and subject to availability. Unless a seat reservation system is made available for a particular service, seats will be allocated on a first-come, first-served basis." },
          { p: "Where seat reservations are available, members may be required to reserve a seat in advance in accordance with the applicable booking terms and instructions." },
          { p: "Access to Clubpass Home Express through a Clubpass membership does not, by itself, guarantee a seat on any particular service. Where no reservation is required, members are encouraged to arrive at the designated pick-up point in good time." },
          { p: "If a service reaches its passenger capacity, Clubpass may be unable to accept additional passengers who do not hold a confirmed reservation, where applicable." },
          { p: "To the extent permitted by applicable law, Reward Land and Clubpass will not be responsible for any loss, cost, inconvenience or alternative transportation expense arising solely from a service reaching its passenger capacity." },
        ],
      },
      {
        sub: "2.3 Late Arrival and Missed Services",
        blocks: [
          { p: "Members are responsible for arriving at the designated pick-up point before the stated departure time." },
          { p: "Clubpass Home Express is not required to delay its scheduled departure for late passengers." },
          { p: "If a member arrives after the vehicle has departed, the service will be considered missed." },
          { p: "To the extent permitted by applicable law, Reward Land and Clubpass will not be responsible for any loss, expense, inconvenience or alternative transportation costs incurred as a result of a member arriving late or missing the service." },
        ],
      },
      {
        sub: "2.4 Right to Refuse Boarding",
        blocks: [
          { p: "The safety, comfort and wellbeing of our members, drivers, staff and partners are our priority." },
          { p: "We reserve the right to refuse boarding to any person where our driver, staff member, representative or transport partner reasonably considers that the person:" },
          {
            list: [
              "appears excessively intoxicated or otherwise unfit to travel safely;",
              "is behaving in an aggressive, abusive, threatening, disruptive or excessively rowdy manner;",
              "poses or may reasonably pose a safety risk to themselves or others;",
              "is harassing or intimidating other passengers, drivers or staff;",
              "refuses to comply with reasonable safety or boarding instructions;",
              "is carrying prohibited, dangerous or inappropriate items; or",
              "is otherwise likely to materially disrupt the safe or reasonable operation of the Clubpass Home Express.",
            ],
          },
          { p: "A member who is refused boarding remains responsible for arranging their own alternative transportation." },
          { p: "Any decision to refuse boarding will be made having regard to the circumstances at the time and, where practicable, the safety of the affected member and other passengers." },
        ],
      },
      {
        sub: "2.5 Behaviour While On Board",
        blocks: [
          { p: "Members must behave responsibly and respectfully while using Clubpass Home Express." },
          { p: "Members must not:" },
          {
            list: [
              "threaten, abuse, intimidate or harass another passenger, driver or staff member;",
              "fight or engage in violent behaviour;",
              "deliberately damage or misuse the vehicle or equipment;",
              "interfere with the driver or operation of the vehicle;",
              "create excessive disturbances that materially affect other passengers;",
              "smoke or vape on board;",
              "consume prohibited substances;",
              "deliberately create an unsafe or unsanitary environment; or",
              "refuse to follow reasonable instructions relating to passenger safety.",
            ],
          },
          { p: "Members must keep their seatbelts fastened whenever required and comply with all applicable safety instructions." },
        ],
      },
      {
        sub: "2.6 Intoxicated Passengers",
        blocks: [
          { p: "Clubpass Home Express is intended to provide members with a convenient transportation option after a night out. However, membership does not provide an unconditional right to board while intoxicated." },
          { p: "Members who have consumed alcohol remain responsible for their own conduct and condition." },
          { p: "Where a member's level of intoxication creates a reasonable concern regarding safety, aggression, disruption, inability to travel safely, or the wellbeing of other passengers, Clubpass may refuse boarding or, where reasonably necessary and safe to do so, require the member to leave the service." },
        ],
      },
      {
        sub: "2.7 Unruly Behaviour and Penalties",
        blocks: [
          { p: "Members who engage in unruly, dangerous, abusive or disruptive behaviour may have their access to Clubpass Home Express suspended or withdrawn." },
          { p: "Depending on the seriousness of the incident and the member's previous conduct, penalties may include:" },
          {
            penalties: [
              ["First offence", "Warning and/or suspension from Clubpass Home Express for up to one (1) month."],
              ["Second offence", "Suspension from Clubpass Home Express for up to three (3) months."],
              ["Third offence", "Suspension from Clubpass Home Express for up to six (6) months."],
              ["Serious or repeated offences", "Indefinite suspension or permanent removal of access to Clubpass Home Express and/or termination of Clubpass membership."],
            ],
          },
          { p: "The above escalation is a general guideline. Clubpass reserves the right to impose a more serious penalty for a first or subsequent offence where reasonably warranted by the severity of the conduct." },
          { p: "Serious misconduct, including violence, credible threats of violence, sexual harassment, deliberate property damage or conduct that creates a significant safety risk, may result in immediate suspension or termination." },
          { p: "Where appropriate, incidents may also be reported to the relevant authorities." },
        ],
      },
      {
        sub: "2.8 Damage and Cleaning",
        blocks: [
          { p: "Members may be held responsible, to the extent permitted by law, for reasonable costs arising from deliberate or negligent damage they cause to a Clubpass Home Express vehicle or its contents." },
          { p: "Where a member's conduct results in extraordinary cleaning being reasonably required beyond ordinary cleaning between services, Clubpass may seek reimbursement of reasonable cleaning costs from that member." },
        ],
      },
    ],
  },
  {
    id: "routes",
    title: "3. Routes, Pick-Up Points and Schedules",
    blocks: [
      { clause: "3.1", text: "Clubpass Home Express routes, pick-up points, destinations, departure times and operating dates may vary." },
      { clause: "3.2", text: "Members are responsible for checking the latest route and schedule information before travelling." },
      { clause: "3.3", text: "Operational circumstances including traffic, road closures, accidents, weather, vehicle issues, regulatory requirements and other circumstances outside our reasonable control may result in delays, route changes or cancellations." },
      { clause: "3.4", text: "Where reasonably practicable, Clubpass will endeavour to communicate material service changes to affected members." },
    ],
  },
  {
    id: "events",
    title: "4. Clubpass Events, Tickets and Partner Benefits",
    blocks: [
      { clause: "4.1", text: "Clubpass may provide members with access to events, tickets, promotions, venue privileges, products, discounts or other partner benefits." },
      { clause: "4.2", text: "Individual offers may be subject to additional terms, availability, capacity limits, booking requirements and validity periods." },
      { clause: "4.3", text: "Benefits provided by third-party merchants, venues, event organisers or service providers may also be subject to their respective terms and conditions." },
      { clause: "4.4", text: "Unless otherwise stated, Clubpass benefits cannot be exchanged for cash." },
    ],
  },
  {
    id: "rewards",
    title: "5. R Coins and Rewards",
    blocks: [
      { clause: "5.1", text: "Eligible Clubpass activities may allow members to earn R Coins or other rewards." },
      { clause: "5.2", text: "The earning and redemption of R Coins may be subject to the applicable Reward Land terms, promotion conditions and eligibility requirements." },
      { clause: "5.3", text: "Clubpass reserves the right to withhold or reverse rewards that were obtained through fraud, abuse, manipulation, duplicate transactions, cancelled transactions or other activity that breaches applicable terms." },
    ],
  },
  {
    id: "suspension",
    title: "6. Suspension and Termination",
    blocks: [
      { clause: "6.1", text: "Clubpass may suspend or terminate a member's access to specific Clubpass benefits where the member materially breaches these Terms, misuses Clubpass services, engages in fraudulent activity, or creates a material safety or security risk." },
      { clause: "6.2", text: "Where appropriate, Clubpass may restrict access to a particular service, such as Clubpass Home Express, without terminating the member's entire Clubpass membership." },
      { clause: "6.3", text: "The length and nature of any suspension will take into account factors such as the severity of the incident, previous incidents and risks to other members, staff or partners." },
    ],
  },
  {
    id: "responsibility",
    title: "7. Personal Responsibility",
    blocks: [
      { clause: "7.1", text: "Members are responsible for their personal belongings while using Clubpass services." },
      { clause: "7.2", text: "Members should ensure that they are medically and physically fit to travel and should seek appropriate assistance where necessary." },
      { clause: "7.3", text: "Members remain responsible for arranging alternative transportation where they miss a service, are unable to obtain a seat, are refused boarding for legitimate safety or conduct reasons, or where a service cannot operate due to circumstances outside Clubpass' reasonable control." },
    ],
  },
  {
    id: "liability",
    title: "8. Liability",
    blocks: [
      { clause: "8.1", text: "Nothing in these Terms excludes or limits any liability that cannot lawfully be excluded or limited under applicable Singapore law." },
      { clause: "8.2", text: "Subject to Clause 8.1, Reward Land and Clubpass will not be responsible for indirect or consequential losses arising from the use of Clubpass services." },
      { clause: "8.3", text: "Where Clubpass services are provided by third-party transport operators, venues, merchants or other partners, those services may additionally be governed by the terms applicable to the relevant third-party provider." },
      { clause: "8.4", text: "Nothing in these Terms is intended to exclude responsibility for losses caused by our fraud, wilful misconduct, or any other liability that cannot legally be excluded." },
    ],
  },
  {
    id: "changes-to-clubpass",
    title: "9. Changes to Clubpass",
    blocks: [
      { p: "Clubpass may modify its membership benefits, participating partners, Home Express routes, schedules, pricing or other service features from time to time." },
      { p: "Where a change materially affects an existing paid membership, Clubpass will provide such notice as may be reasonably appropriate or required by applicable law." },
    ],
  },
  {
    id: "changes-to-terms",
    title: "10. Changes to These Terms",
    blocks: [
      { p: "Clubpass may update these Terms from time to time to reflect changes to its services, operations, legal requirements or policies." },
      { p: "The latest version of these Terms will be made available through the Clubpass website, Reward Land platform or other appropriate channels." },
      { p: "Members' continued use of Clubpass after updated Terms take effect will constitute acceptance to the extent permitted by applicable law." },
    ],
  },
  {
    id: "governing-law",
    title: "11. Governing Law",
    blocks: [
      { p: "These Terms are governed by and construed in accordance with the laws of the Republic of Singapore." },
      { p: "Any dispute arising from or relating to these Terms or the use of Clubpass shall be subject to the jurisdiction of the courts of Singapore." },
    ],
  },
];

/** Clubpass Terms & Conditions. Public — no sign-in needed to read them. */
export default function Terms() {
  return (
    <LegalPage
      title="Clubpass Terms & Conditions"
      pageTitle="Clubpass Terms & Conditions | RewardLand"
      lastUpdated={LAST_UPDATED}
    >
        <div className="tc-lede">
          <p>
            These Terms &amp; Conditions (“Terms”) govern your access to and use of Clubpass,
            including Clubpass membership benefits, events, offers, products, services, and the
            Clubpass Home Express transportation service.
          </p>
          <p>
            Clubpass is operated by MyRepublic Limited (“Reward Land”, “Clubpass”, “we”, “us” or
            “our”).
          </p>
          <p>
            By purchasing or subscribing to a Clubpass membership, booking or using a Clubpass
            service, or otherwise participating in Clubpass benefits, you agree to these Terms.
          </p>
        </div>

        <nav className="tc-toc" aria-label="Contents">
          <p className="tc-toc-head">Contents</p>
          <ol>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title.replace(/^\d+\.\s*/, "")}</a>
              </li>
            ))}
            <li>
              <a href="#contact">Contact Us</a>
            </li>
          </ol>
        </nav>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="tc-section">
            <h2>{section.title}</h2>
            <LegalBlocks blocks={section.blocks} />
          </section>
        ))}

        <section id="contact" className="tc-section">
          <h2>12. Contact Us</h2>
          <p>
            For questions, feedback or disputes relating to Clubpass or Clubpass Home Express,
            please contact:
          </p>

          <address className="tc-contact">
            <b>Clubpass / Reward Land</b>
            <span>
              Email: <a href="mailto:clubpass@rewardland.sg">clubpass@rewardland.sg</a>
            </span>
            <span>
              Website:{" "}
              <a href="https://clubpass.rewardland.sg/" target="_blank" rel="noopener noreferrer">
                https://clubpass.rewardland.sg/
              </a>
            </span>
          </address>
        </section>
    </LegalPage>
  );
}
