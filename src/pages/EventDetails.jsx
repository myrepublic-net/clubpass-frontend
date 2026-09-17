import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, MapPin, Play } from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import Markdown from "../components/Markdown.jsx";
import UserMenu from "../components/UserMenu.jsx";
import { useTicket } from "../hooks/useTickets.js";
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
  const { ticket: event, status } = useTicket(id);

  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  // So Login sends them back to this same event instead of the home page.
  const loginState = { from: `${location.pathname}${location.search}` };

  const [activeImage, setActiveImage] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Which slide is playing, so the overlay gets out of the way of the video's
  // own controls once it starts.
  const [playing, setPlaying] = useState(null);
  const videoRefs = useRef([]);

  // The gallery is a native horizontal scroller, so swiping it is what moves
  // it — the counter and dots follow the scroll position rather than driving it.
  const trackRef = useRef(null);

  const activeMedia = event?.media?.[activeImage] ?? null;

  const syncActiveImage = () => {
    const track = trackRef.current;
    if (!track) return;

    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActiveImage((prev) => (prev === index ? prev : index));
  };

  const scrollToImage = (index) => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  if (status === "loading") {
    return (
      <div className="evd-page">
        <header className="evd-header">
          <Link className="evd-back" to="/#venues" aria-label="Back">
            <ArrowLeft size={18} />
          </Link>
          <h1>Event Details</h1>
        </header>
        <div className="evd-body">
          <p className="evd-not-found">Loading event…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="evd-page">
        <header className="evd-header">
          <Link className="evd-back" to="/#venues" aria-label="Back">
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
        <Link className="evd-back" to="/#venues" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <h1>Event Details</h1>

        {userName ? (
          <UserMenu userName={userName} />
        ) : (
          <Link className="evd-login-btn" to="/login" state={loginState}>
            Login / Signup
          </Link>
        )}
      </header>

      <div className="evd-gallery">
        <span className="evd-counter">
          {activeImage + 1}/{event.media.length}
        </span>

        <div className="evd-track" ref={trackRef} onScroll={syncActiveImage}>
          {event.media.map((item, index) =>
            item.type === "video" ? (
              <video
                key={item.url}
                ref={(node) => { videoRefs.current[index] = node; }}
                className="evd-hero-img"
                src={item.url}
                playsInline
                preload="metadata"
                controls={playing === index}
                onPlay={() => setPlaying(index)}
                onPause={() => setPlaying((prev) => (prev === index ? null : prev))}
              />
            ) : (
              <img
                key={item.url}
                className="evd-hero-img"
                src={item.url}
                alt={`${event.title} — photo ${index + 1}`}
              />
            ),
          )}
        </div>

        {activeMedia?.type === "video" && playing !== activeImage && (
          <button
            type="button"
            className="evd-play"
            onClick={() => videoRefs.current[activeImage]?.play()}
            aria-label="Play event video"
          >
            <Play size={22} fill="currentColor" />
          </button>
        )}

        {/* Swiping covers touch; on a desktop there's no sideways gesture for
            a mouse, so the gallery needs buttons of its own. */}
        {event.media.length > 1 && (
          <>
            <button
              type="button"
              className="evd-arrow evd-arrow--prev"
              onClick={() => scrollToImage(activeImage - 1)}
              disabled={activeImage === 0}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className="evd-arrow evd-arrow--next"
              onClick={() => scrollToImage(activeImage + 1)}
              disabled={activeImage === event.media.length - 1}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div className="evd-dots-main">
          <div className="evd-dots">
            {event.media.map((item, index) => (
              <button
                key={item.url}
                type="button"
                className={`evd-dot${index === activeImage ? " is-active" : ""}`}
                aria-label={`Show image ${index + 1}`}
                onClick={() => setActiveImage(index)}
              />
            ))}
          </div>
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

        {event.description && (
          <>
            <Markdown className={`evd-description${expanded ? " is-expanded" : ""}`}>
              {event.description}
            </Markdown>
            {/* Short descriptions fit in the collapsed box — no toggle for those. */}
            {event.description.length > 220 && (
              <button
                type="button"
                className="evd-see-more"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? "See less" : "See more"}
              </button>
            )}
          </>
        )}
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
