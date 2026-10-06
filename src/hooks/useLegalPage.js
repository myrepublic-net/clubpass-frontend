import { useEffect, useState } from "react";

import { fetchLegalPage } from "../api/legal.js";
import { formatLegalDate, parseLegal } from "../components/legalMarkdown.jsx";

/**
 * A legal page's copy from Strapi as { lede, sections, lastUpdated }.
 *
 * `fallback` (same shape) renders until the request lands, and stays if the
 * CMS can't be reached or the entry comes back empty.
 */
export default function useLegalPage(type, fallback) {
  const [page, setPage] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    fetchLegalPage(type).then(
      ({ body, updatedAt }) => {
        if (cancelled) return;
        const parsed = parseLegal(body);
        if (!parsed.sections.length) return;
        setPage({ ...parsed, lastUpdated: formatLegalDate(updatedAt) ?? fallback.lastUpdated });
      },
      (error) => console.error(`${type} failed to load`, error),
    );

    return () => {
      cancelled = true;
    };
    // fallback is a module-level constant on both pages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return page;
}
