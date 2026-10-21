/**
 * The events home page (/events) from Strapi: the hero, the curated event
 * rows, the "create a free account" band and the membership pitch.
 *
 * It's one single-type entry. Each row's tickets come back as full ticket
 * entries, so they go through the same normaliser as /api/tickets and the
 * cards read them exactly as before.
 */

import { normaliseTicket } from "./tickets.js";

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";

const TOKEN = import.meta.env.VITE_STRAPI_TOKEN_GET;

const QUERY =
  "populate[hero_section][populate]=*" +
  "&populate[create_account_section][populate]=*" +
  "&populate[become_member_section][populate]=*" +
  // tickets[populate]=* brings each ticket's tiers, venue and banners.
  "&populate[sections][populate][tickets][populate]=*";

/** The original upload — these are hero and illustration art, shown full size. */
const mediaUrl = (item) => item?.url ?? null;

function normalise(data) {
  const hero = data?.hero_section;
  const signup = data?.create_account_section;
  const promo = data?.become_member_section;

  return {
    hero: hero
      ? {
          title: hero.hero_title ?? "",
          text: hero.hero_description ?? "",
          image: mediaUrl(hero.hero_image),
          loggedInImage: mediaUrl(hero.logged_in_image),
        }
      : null,
    sections: (data?.sections ?? []).map((section) => ({
      id: section.id,
      title: section.title ?? "",
      seeAllText: section.see_all_text ?? "",
      events: (section.tickets ?? []).map(normaliseTicket),
    })),
    signup: signup
      ? {
          title: signup.title ?? "",
          text: signup.description ?? "",
          buttonText: signup.button_text ?? "",
          buttonLink: signup.button_link ?? "",
          leftImage: mediaUrl(signup.left_image),
          rightImage: mediaUrl(signup.right_image),
        }
      : null,
    promo: promo
      ? {
          badge: promo.section_badge ?? "",
          label: promo.sub_heading ?? "",
          heading: promo.heading ?? "",
          text: promo.description ?? "",
          price: promo.price ?? "",
          buttonText: promo.button_text ?? "",
        }
      : null,
  };
}

// Same short cache as the tickets: back-and-forth navigation reuses it, CMS
// edits and stock changes still show up without a hard reload.
const CACHE_MS = 30_000;
let pending = null;
let fetchedAt = 0;

export function fetchEventHome() {
  if (pending && Date.now() - fetchedAt > CACHE_MS) pending = null;

  if (!pending) {
    fetchedAt = Date.now();
    pending = (async () => {
      const res = await fetch(`${BASE_URL}/api/event-home?${QUERY}`, {
        headers: {
          "Content-Type": "application/json",
          ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
        },
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.error?.message ?? `Couldn't load the events page (${res.status})`);
      }

      return normalise(body?.data);
    })();

    // A failed load shouldn't be cached — the next mount should retry.
    pending.catch(() => {
      pending = null;
    });
  }

  return pending;
}
