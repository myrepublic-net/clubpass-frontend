import { Link } from "react-router";

import "../css/site-footer.css";

const SITE = "https://www.rewardland.sg";

/**
 * The Clubpass footer — the home page and the Terms, Privacy and Contact pages
 * all render this one, so the links can't drift apart.
 */
export default function SiteFooter() {
  return (
    <footer className="cp-footer site-footer">
      <div className="cp-container cp-footer-inner">
        <Link className="cp-brand" to="/" aria-label="Clubpass home">
          <img src="/images/cp-logo.png" alt="Clubpass" />
        </Link>

        <div className="cp-footer-links">
          <a href={SITE}>About RewardLand</a>
          <Link to="/terms-and-conditions">Terms of Use</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/contact-us">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
}
