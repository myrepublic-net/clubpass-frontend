import { useEffect, useState } from "react";

import { fetchHome } from "../api/home.js";

/**
 * Home page content from Strapi.
 *
 * `fallback` is what renders until the request lands — the page is the public
 * landing page, so it shows the shipped copy rather than blanking out or
 * jumping while the CMS answers, and keeps it if the CMS can't be reached.
 */
export default function useHome(fallback) {
  const [content, setContent] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    fetchHome().then(
      (loaded) => {
        if (cancelled) return;
        // Only replace the parts Strapi actually returned.
        setContent((current) => ({
          hero: loaded.hero?.length ? loaded.hero : current.hero,
          beforeTickets: loaded.beforeTickets ?? current.beforeTickets,
          why: loaded.why ?? current.why,
        }));
      },
      (error) => console.error("ClubPass home content failed to load", error),
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}
