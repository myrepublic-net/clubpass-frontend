import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { ArrowLeft, Calendar, ChevronRight, MapPin, Play } from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import { getEventById } from "../data/events.js";
import "../css/event-details.css";

/**
 * Reached from the "View event details" row on each ClubPass.jsx venue card.
 * Public — unlike /clubpass-app and /dashboard this isn't wrapped in
 * UserGate, since a guest can still look at what an event is before joining.
 * The header just reflects whichever state applies: signed in (their name)
 * or signed out (a Login / Signup prompt).
 */
export default function EventDetails() {
  const { id } = useParams();
  const location = useLocation();
  const event = getEventById(id);

  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  // So Login sends them back to this same event instead of the home page.
  const loginState = { from: `${location.pathname}${location.search}` };

  const [activeImage, setActiveImage] = useState(0);
  const [expanded, setExpanded] = useState(false);

  if (!event) {
    return (
      <div className="evd-page">
        <header className="evd-header">
          <Link className="evd-back" to="/" aria-label="Back">
            <ArrowLeft size={18} />
          </Link>
          <h1>Event Details</h1>
        </header>
        <div className="evd-body">
          <p className="evd-not-found">
            We couldn't find that event. <Link to="/">Back to ClubPass</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="evd-page">
      <header className="evd-header">
        <Link className="evd-back" to="/" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <h1>Event Details</h1>

        {userName ? (
          <span className="evd-hi">Hi, {userName}</span>
        ) : (
          <Link className="evd-login-btn" to="/login" state={loginState}>
            Login / Signup
          </Link>
        )}
      </header>

      <div className="evd-gallery">
        <span className="evd-counter">
          {activeImage + 1}/{event.images.length}
        </span>

        <img className="evd-hero-img" src={event.images[activeImage]} alt={event.title} />

        <button
          type="button"
          className="evd-play"
          aria-label="Play event video"
        >
          <Play size={22} fill="currentColor" />
        </button>

        <div className="evd-dots">
          {event.images.map((image, index) => (
            <button
              key={image}
              type="button"
              className={`evd-dot${index === activeImage ? " is-active" : ""}`}
              aria-label={`Show image ${index + 1}`}
              onClick={() => setActiveImage(index)}
            />
          ))}
        </div>
      </div>

      <div className="evd-body">
        <h2 className="evd-title">{event.title}</h2>

        <p className="evd-datetime">
          <Calendar size={16} />
          {event.date} &bull; {event.time}
        </p>

        <a
          className="evd-venue-card"
          href={event.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="evd-venue-icon">
            <MapPin size={18} />
          </span>
          <span className="evd-venue-info">
            <span className="evd-venue-name">{event.venue}</span>
            <span className="evd-venue-address">{event.address}</span>
            <span className="evd-venue-link">Open in Maps</span>
          </span>
          <ChevronRight size={18} className="evd-venue-chevron" />
        </a>

        <p className={`evd-description${expanded ? " is-expanded" : ""}`}>
          {event.description}
        </p>
        <button
          type="button"
          className="evd-see-more"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "See less" : "See more"}
        </button>
      </div>

      <footer className="evd-footer">
        <div className="evd-price">
          <span>From</span>
          <b>${event.priceFrom}</b>
        </div>

        <Link className="evd-cta" to={`/events/${event.id}/tickets`}>
          Get Tickets Now
        </Link>
      </footer>
    </div>
  );
}
