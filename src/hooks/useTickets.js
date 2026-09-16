import { useEffect, useState } from "react";

import { fetchTickets } from "../api/tickets.js";

/**
 * Events from Strapi. `status` matters because the pages used to read static
 * data and render instantly — without it they'd flash "we couldn't find that
 * event" while the request is still in the air.
 */
export function useTickets() {
  const [state, setState] = useState({ status: "loading", tickets: [], error: "" });

  useEffect(() => {
    let cancelled = false;

    fetchTickets().then(
      (tickets) => {
        if (!cancelled) setState({ status: "ready", tickets, error: "" });
      },
      (error) => {
        console.error("ClubPass events failed to load", error);
        if (!cancelled) setState({ status: "error", tickets: [], error: error.message });
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** One event by its documentId. */
export function useTicket(id) {
  const { status, tickets, error } = useTickets();

  return {
    status,
    error,
    ticket: status === "ready" ? tickets.find((ticket) => ticket.id === id) ?? null : null,
  };
}
