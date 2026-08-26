import { Link } from "react-router";

import "../css/not-found.css";

const APP_LINK = "https://rewardland.onelink.me/EwIe/start";

/**
 * 404, in the language of the product: a stop the coach doesn't call at.
 *
 * The little route line is inline SVG rather than an image — a 404 is exactly
 * the page you don't want waiting on an asset that might itself be missing.
 */
function RouteLine() {
  return (
    <svg className="cp404-line" viewBox="0 0 260 40" role="img" aria-label="A route line with a stop missing">
      <path
        d="M12 20 H100"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".55"
      />
      <path
        d="M160 20 H248"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="7 9"
        opacity=".35"
      />
      <circle cx="12" cy="20" r="6" fill="currentColor" opacity=".55" />
      <circle cx="248" cy="20" r="6" fill="currentColor" opacity=".35" />
      {/* The stop that isn't there. */}
      <circle cx="130" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 6" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="cp404-page">
      <title>Stop not found | ClubPass</title>
      <meta name="robots" content="noindex" />

      <div className="cp404-card">
        <span className="cp404-code">404</span>

        <RouteLine />

        <h1>This stop isn&rsquo;t on the route.</h1>

        <p>
          The coach doesn&rsquo;t call here — the link may be old, or a letter short. Nothing&rsquo;s
          lost: the last pick-up is still waiting.
        </p>

        <Link className="cp404-btn" to="/">
          Back to ClubPass
        </Link>

        <a className="cp404-quiet" href={APP_LINK} target="_blank" rel="noopener noreferrer">
          Open the RewardLand app
        </a>
      </div>
    </div>
  );
}
