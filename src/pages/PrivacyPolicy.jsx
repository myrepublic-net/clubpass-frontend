import LegalPage, { LegalBlocks } from "../components/LegalPage.jsx";

/** Shown under the title. Update whenever the policy changes. */
const LAST_UPDATED = "17-Sep-2026";

const SUPPORT_EMAIL = "clubpass@rewardland.sg";

/*
 * The policy as data, rendered by LegalBlocks (see components/LegalPage.jsx):
 * `clause` is a lettered clause ("a. …"), `points` the "(i) …" items under one.
 */
const SECTIONS = [
  {
    id: "your-privacy",
    title: "1. Your Privacy",
    blocks: [
      { p: "We will take reasonable care to ensure that your personal information is accurate, complete, up-to-date and stored in a secure environment, protected from unauthorised access, modification, loss or disclosure." },
    ],
  },
  {
    id: "personal-information",
    title: "2. Personal Information",
    blocks: [
      { clause: "a.", text: "“Personal Information” refers to your personal particulars obtained by us in the course of our dealings with you." },
      { clause: "b.", text: "Such personal information includes your use of our products and services, name, mailing addresses, phone number, email addresses, service details, payment details and credit history. Our offices and retail stores are monitored by closed circuit television camera which record photographic and videographic images of persons on premises." },
      { clause: "c.", text: "We may use “cookies” or other similar tracking technologies (“Cookies”), when you visit our Sites or use our products and services to distinguish you from other users. Through Cookies, it might also include how you use our Website to help us develop and improve our website, including details of your domain name and Internet Protocol (IP) address, operating system, browser version, cookie details, how long you stayed on a page, the route you took to navigate through the pages and the website that you visited prior to accessing our site." },
      { clause: "d.", text: "We collect your personal information from you, from third parties such as credit reporting agencies and suppliers, from public sources and from our own systems." },
    ],
  },
  {
    id: "how-we-use",
    title: "3. How we use Your Personal Information",
    blocks: [
      { clause: "a.", text: "Collecting Personal Information helps us better understand what you need from us. We may collect personal information either directly from you or your authorised representatives, from third parties (such as credit reference agencies) or through our Website, mobile and web applications, services application forms and other methods including surveys and competitions." },
      { clause: "b.", text: "We may collect and use your Personal Information to:" },
      {
        points: [
          ["(i)", "verify your identity;"],
          ["(ii)", "carry out credit checking and scoring;"],
          ["(iii)", "plan, provision and bill for products and services;"],
          ["(iv)", "provide access to, personalise your experience on, and improve the functionality of our website, mobile applications, and web applications;"],
          ["(v)", "manage your relationship with us including Customer Support related activities and technical assistance through remote access;"],
          ["(vi)", "administer contests, competitions or other similar promotions, including the results and identifying the winners;"],
          ["(vii)", "notify you with details of products, services, special offers and rewards that we think will be of interest to you;"],
          ["(viii)", "carry our market and product analysis to improve our products and services and the marketing of our (and our group companies’) products and services;"],
          ["(ix)", "gather feedback and statistics to improve our network, servers, website, mobile and web applications;"],
          ["(x)", "improve your user experience through profiling and analysing your preferences;"],
          ["(xi)", "manage bad debt and prevent fraud or illegal activities;"],
          ["(xii)", "carry out activities connected with running of our business (such as personnel training, quality control, dispute resolution, and network monitoring) and in connection with the transfer of any part of our business in respect of which you are a customer or potential customer;"],
          ["(xiii)", "investigate any action that may threaten network security or integrity;"],
          ["(xiv)", "complying with any applicable law, regulations, guidelines or rules or to render assistance to law enforcement, governmental and regulatory agencies;"],
          ["(xv)", "provide complementary products or services, or rewards to you from our business partners; and"],
          ["(xvi)", "other related purposes."],
        ],
      },
      { clause: "c.", text: "Clubpass Reward Land will not use your Personal Information for any purpose not permitted by law or beyond the stated purpose you have consented to." },
      { clause: "d.", text: "The Clubpass by Reward Land Website contains links to other sites. We are not responsible for the privacy practices or the content of other websites." },
    ],
  },
  {
    id: "sharing",
    title: "4. Who do we share your Personal Information to",
    blocks: [
      { clause: "a.", text: "Apart from our staff, we may share your personal information with third parties to perform obligations or carry out services to us, related to the provision our products or services to you. Those entities may include:" },
      {
        points: [
          ["(i)", "companies related to us;"],
          ["(ii)", "our business partners, marketing partners and authorised service providers;"],
          ["(iii)", "credit providers, credit reporting agencies, debt collection agencies or debt purchasers;"],
          ["(iv)", "telecommunications carriers and service providers;"],
          ["(v)", "our professional advisors; and"],
          ["(vi)", "our suppliers such as call centres, payment processing companies, call centre companies, financial institutions or debt collection agencies."],
        ],
      },
      { clause: "b.", text: "We are required to disclose your Personal Information to the parties described above so that they may carry out their obligations to us, and to you. Our disclosure of your Personal Information may, at times, be subject to their privacy policies. To every extent possible, we require these parties to act consistently with the personal information protections we have put in place." },
      { clause: "c.", text: "We also reserve the right to disclose your Personal Information to law enforcement agencies, government regulators and our professional advisers, to the extent necessary as required by appliable laws." },
      { clause: "d.", text: "If you post information on any of our Websites or social media platforms, any information on your post, such as your user name, may be seen by other visitors." },
    ],
  },
  {
    id: "retention",
    title: "5. How long do we retain your Personal Information",
    blocks: [
      { p: "We retain your Personal Information for as long as it is necessary to fulfil the purposes outlined in this Privacy Policy, for legal or business purposes of Clubpass by Reward Land, or as required or allowed by law. We will cease to retain such Personal Data when it is no longer required for the foregoing purposes." },
    ],
  },
  {
    id: "access",
    title: "6. How you can access and update your Personal Information",
    blocks: [
      { clause: "a.", text: "You must ensure your listed customer details are current, complete and accurate. You may correct or update your customer details by contacting our Customer Support." },
      { clause: "b.", text: "If you require access or a copy of your Personal Information within our possession, please contact us according to Clause 11 and we will assess your request. In some cases, we may impose a reasonable charge for making copies of Personal Information available to you. If so, we will advise you of the charge prior to making the information available to you." },
    ],
  },
  {
    id: "withdrawing-consent",
    title: "7. Withdrawing your Consent",
    blocks: [
      { clause: "a.", text: "You may request to withdraw your consent by contacting us according to Clause 11. Your request for withdrawal of consent will take effect within 30 days upon receipt of your request. Please note that use of your personal data may be essential for us to provide the product or service that you subscribed. Therefore, your withdrawal of consent may impair our ability to continue providing the product or service to you. Your withdrawal of consent does not affect our right to continue to collect, use and disclose personal data where permitted or required under applicable laws." },
      { clause: "b.", text: "If you wish to withdraw your consent to receive marketing messages about our exclusive offers from us or our business partners, please contact our Customer Support or unsubscribe from our newsletter. Your request will be processed within 30 days. Non-marketing messages including product and service updates and notices will not be affected by your consent withdrawal." },
    ],
  },
  {
    id: "protecting",
    title: "8. Protecting Your Personal Data",
    blocks: [
      { clause: "a.", text: "We take reasonable physical, technical and administrative steps to help prevent loss, misuse, unauthorized access, disclosure or modification of Personal Information. However, please understand that the transmission of data over the Internet or any other public network may be subject to loss, interception and misuse. We do not represent, warrant or undertake that your Personal Information transmitted through online means will remain secure, and disclaim all liability arising from such transmission." },
      { clause: "b.", text: "We strongly urge you to protect and secure access of your account with us, to minimise risk of unauthorised use." },
    ],
  },
  {
    id: "cookies",
    title: "9. Cookies",
    blocks: [
      { clause: "a.", text: "Cookies helps us to provide you with a better customer experience, when browsing our Sites. Cookies are small data files and may contain unique identifiers stored on your device by an online site. When you use our Site, we may collect standard information that is sent from your browser to our Website, including technical and statistical information." },
      { clause: "b.", text: "You can usually choose to set your browser settings to manage Cookies. If you choose to remove or reject Cookies, you may not be able to access all or parts of our WebSite or services." },
    ],
  },
  {
    id: "changes",
    title: "10. Changes to this Privacy Policy",
    blocks: [
      { p: "We may review, amend or update this Privacy Policy from time to time without prior written notice. Updates to the Privacy Policy will be published on this page. We recommend that your review this page periodically for updates. Your continuous use of our Websites, products and services, will be deemed acceptance of any changes or additions to this Privacy Policy." },
    ],
  },
  {
    id: "contact",
    title: "11. Contacting Us",
    blocks: [
      {
        p: (
          <>
            If you have any query or feedback regarding this Privacy Policy, you may contact our
            Customer Support: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </>
        ),
      },
    ],
  },
];

/** Clubpass Privacy Policy. Public — no sign-in needed to read it. */
export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      pageTitle="Clubpass Privacy Policy | RewardLand"
      lastUpdated={LAST_UPDATED}
    >
      <div className="tc-lede">
        <p>
          Clubpass by Reward Land is a brand that is owned and operated by MyRepublic Limited
          (MyRepublic). At Clubpass by Reward Land, we are committed to maintain the security and
          confidentiality of the personal information held by us. This Privacy Policy (“Policy”)
          describes how we look after the personal information we obtain or you provide us with
          when you use our Website (clubpass.rewardland.sg), online services, mobile applications
          (“collectively, the “Sites”), and when you sign-up and use our products and services.
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
        </ol>
      </nav>

      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="tc-section">
          <h2>{section.title}</h2>
          <LegalBlocks blocks={section.blocks} />
        </section>
      ))}
    </LegalPage>
  );
}
