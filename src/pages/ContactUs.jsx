import { Link } from "react-router";
import { Mail } from "lucide-react";

import LegalPage from "../components/LegalPage.jsx";

const SUPPORT_EMAIL = "clubpass@rewardland.sg";

/** Contact Us — same header and layout as the Terms and Privacy pages. */
export default function ContactUs() {
  return (
    <LegalPage title="Contact Us" pageTitle="Contact Clubpass | RewardLand">
      <div className="tc-lede">
        <p>Need help or have a question about Clubpass by Reward Land? We’re here for you!</p>
        <p>
          Check out our FAQs <Link to="/faq">here</Link> for answers to frequently asked
          questions. If you need further assistance, reach out to us:
        </p>
      </div>

      <section className="tc-section">
        <a className="tc-contact-card" href={`mailto:${SUPPORT_EMAIL}`}>
          <span className="tc-contact-icon" aria-hidden="true">
            <Mail size={22} />
          </span>
          <span>
            <b>Email us at {SUPPORT_EMAIL}</b>
            <small>Our team will get back to you within one working day.</small>
          </span>
        </a>
      </section>
    </LegalPage>
  );
}
