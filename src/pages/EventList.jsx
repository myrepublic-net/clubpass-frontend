import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search, SlidersHorizontal, Star } from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import UserMenu from "../components/UserMenu.jsx";
import useIsDesktop from "../hooks/useIsDesktop.js";
import { useTickets } from "../hooks/useTickets.js";
import "../css/event-desktop.css";
import "../css/event-list.css";

// One row of three on desktop; "Load More" adds the next batch.
const PAGE_SIZE = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The quick filters. Only ones the event data can answer — there's no genre
 * on an event, so the design's genre pills (EDM, …) aren't here.
 */
const FILTERS = [
  { id: "all", label: "All Events", test: () => true },
  { id: "free", label: "Free Entry", test: (event) => event.priceFrom === 0 },
  {
    id: "week",
    label: "This Week",
    // Today and the six days after it.
    test: (event) => {
      if (!event.startsAt) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return event.startsAt >= today && event.startsAt < new Date(today.getTime() + 7 * DAY_MS);
    },
  },
];

/** One event: the image, then the date, coins, title, venue and both prices. */
function EventCard({ event }) {
  return (
    <Link className="evl-card" to={`/events/${event.id}`}>
      <div className="evl-card-image">{event.images[0] && <img src={event.images[0]} alt="" />}</div>

      <div className="evl-card-body">
        <div className="evl-card-top">
          <span className="evl-card-date">{event.dateBadge}</span>
          {event.memberCoins != null && (
            <span className="evl-card-coins">
              <img src="/images/r-coin.png" alt="" />
              Up to {event.memberCoins.toLocaleString()} R Coins
            </span>
          )}
        </div>

        <h2 className="evl-card-title">{event.title}</h2>
        {event.venue && <p className="evl-card-venue">{event.venue}</p>}

        {(event.publicTier || event.memberTier) && (
          <div className="evl-card-prices">
            {event.publicTier && (
              <div className="evl-price">
                <span>{event.publicTier.label}</span>
                <b>From ${event.publicTier.price}</b>
              </div>
            )}

            {event.memberTier && (
              <div className="evl-price evl-price--member">
                <span>
                  Member <Star size={10} fill="currentColor" />
                </span>
                <b>From ${event.memberTier.price}</b>
                {event.memberSaving > 0 && <small>Save {event.memberSaving}%</small>}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/** Every public event Strapi is publishing, with search, quick filters and paging. */
export default function EventList() {
  const isDesktop = useIsDesktop();
  const userName = useMemo(() => readMemberSession()?.user?.username ?? null, []);

  const { tickets, status } = useTickets();
  // Private events stay off listings but keep working by link.
  const events = useMemo(() => tickets.filter((event) => event.isPublic), [tickets]);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  // Desktop keeps the filter pills behind "Browse by Filter"; mobile always shows them.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const needle = query.trim().toLowerCase();
  const matching = useMemo(() => {
    const { test } = FILTERS.find((item) => item.id === filter);
    return events.filter(
      (event) =>
        test(event) && (!needle || `${event.title} ${event.venue}`.toLowerCase().includes(needle)),
    );
  }, [events, filter, needle]);

  // A new filter or search starts again from the first page.
  const pickFilter = (id) => {
    setFilter(id);
    setShown(PAGE_SIZE);
  };
  const search = (value) => {
    setQuery(value);
    setShown(PAGE_SIZE);
  };

  const account = userName ? (
    <UserMenu userName={userName} />
  ) : (
    <Link className="cp-btn cp-btn-purple cp-btn-sm" to="/login" state={{ from: "/event-list" }}>
      Login / Sign up
    </Link>
  );

  const pills = (
    <div className="evl-filters" role="tablist" aria-label="Filter events">
      {FILTERS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={filter === item.id}
          className={`evl-filter${filter === item.id ? " is-active" : ""}`}
          onClick={() => pickFilter(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  let content;
  if (status === "loading") {
    content = <p className="evl-note">Loading events…</p>;
  } else if (status === "error") {
    content = <p className="evl-note is-error">Events couldn't be loaded right now. Please try again shortly.</p>;
  } else if (!matching.length) {
    content = (
      <p className="evl-note">{needle || filter !== "all" ? "No events match your search." : "No events yet."}</p>
    );
  } else {
    content = (
      <>
        <div className="evl-grid">
          {matching.slice(0, shown).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {shown < matching.length && (
          <div className="evl-more">
            <button type="button" className="evl-more-btn" onClick={() => setShown((count) => count + PAGE_SIZE)}>
              Load More
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="evl-page">
      <title>Clubpass | What's On</title>

      {isDesktop ? (
        <header className="evx-header">
          <div className="evx-header-inner">
            <Link className="evx-logo" to="/" aria-label="Clubpass home">
              <img src="/images/cp-logo.png" alt="Clubpass" />
            </Link>
            <nav className="evx-nav">
              <Link to="/event-list">Events</Link>
              {userName && <Link to="/my-tickets">My Tickets</Link>}
              {account}
            </nav>
          </div>
        </header>
      ) : (
        <header className="evl-header">
          <h1>What's On</h1>
          {account}
        </header>
      )}

      <main className="evl-main">
        {isDesktop && <h1 className="evl-title">What's On</h1>}

        {isDesktop ? (
          <>
            <div className="evl-toolbar">
              <button
                type="button"
                className={`evl-browse${filtersOpen ? " is-open" : ""}`}
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal size={20} aria-hidden="true" />
                Browse by Filter
              </button>

              <label className="evl-search">
                <Search size={20} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search"
                  value={query}
                  onChange={(event) => search(event.target.value)}
                  aria-label="Search events"
                />
              </label>
            </div>
            {filtersOpen && pills}
          </>
        ) : (
          pills
        )}

        {content}
      </main>
    </div>
  );
}
