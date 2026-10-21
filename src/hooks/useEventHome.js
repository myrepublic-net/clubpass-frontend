import { useEffect, useState } from "react";

import { fetchEventHome } from "../api/eventHome.js";

/**
 * Events home content from Strapi.
 *
 * The copy blocks (hero, sign-up, membership) start from `fallback` and keep
 * it if the CMS can't be reached, so the page never blanks out. The event rows
 * have no sensible fallback, so `status` drives their loading / error notes.
 */
export default function useEventHome(fallback) {
  const [state, setState] = useState({ status: "loading", content: { ...fallback, sections: [] } });

  useEffect(() => {
    let cancelled = false;

    fetchEventHome().then(
      (loaded) => {
        if (cancelled) return;
        // Only replace the parts Strapi actually returned.
        setState(({ content }) => ({
          status: "ready",
          content: {
            hero: loaded.hero ?? content.hero,
            sections: loaded.sections,
            signup: loaded.signup ?? content.signup,
            promo: loaded.promo ?? content.promo,
          },
        }));
      },
      (error) => {
        console.error("ClubPass events home failed to load", error);
        if (!cancelled) setState((current) => ({ ...current, status: "error" }));
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
