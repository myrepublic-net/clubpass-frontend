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
          afterTickets: loaded.afterTickets ?? current.afterTickets,
          cta: loaded.cta ?? current.cta,
          faq: loaded.faq?.items?.length ? loaded.faq : current.faq,
          beta: loaded.beta ?? current.beta,
          why: loaded.why ?? current.why,
          howItWorks: loaded.howItWorks?.steps?.length ? loaded.howItWorks : current.howItWorks,
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
