/**
 * Event tickets from Strapi — the venue grid, the event pages and every price
 * in the ticket flow come from here.
 *
 * One content type carries the event, its venue, its banners and its `tiers`
 * list, each tier with its own price, fee, per-buyer limit, global limit and
 * sale window. This module turns that into the shape the pages actually want:
 * an event with a list of tiers, only the ones that have a price set.
 *
 * The old flat price columns (member / earlybird / standard / door) are static
 * leftovers and are never read: an event with no `tiers` shows no tickets.
 */

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";

// Read-only token: the tickets endpoint 403s without one.
const TOKEN = import.meta.env.VITE_STRAPI_TOKEN_GET;

const dayFormat = new Intl.DateTimeFormat("en-SG", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFormat = new Intl.DateTimeFormat("en-SG", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// Spelled out rather than via Intl: locales disagree on September ("Sep" vs
// "Sept"), and the designs use the three-letter form throughout.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sep 20 – Sep 27", or nothing when the window is open-ended. */
function salePeriod(from, to) {
  if (!from && !to) return null;

  const label = (value) => {
    const date = new Date(`${value}T00:00:00`);
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  };

  return [from, to].filter(Boolean).map(label).join(" – ");
}

/**
 * Where today sits in a tier's sale window. `to` is a date with no time, so
 * it counts as on sale for the whole of that day.
 */
function windowStatus(from, to, now = new Date()) {
  if (from && now < new Date(`${from}T00:00:00`)) return "upcoming";
  if (to && now > new Date(`${to}T23:59:59`)) return "ended";
  return "active";
}

/** Largest banner Strapi generated, falling back to the original upload. */
function bannerUrl(banner) {
  return (
    banner?.formats?.large?.url ??
    banner?.formats?.medium?.url ??
    banner?.formats?.small?.url ??
    banner?.url ??
    null
  );
}

/**
 * A banner as the gallery needs it. The type is carried through because a
 * video has to render as one — and is the only thing that gets a play button.
 * Strapi generates no image formats for video, so those use the original.
 */
function banner(item) {
  const isVideo = (item?.mime ?? "").startsWith("video/");
  const url = isVideo ? item?.url : bannerUrl(item);

  return url ? { url, type: isVideo ? "video" : "image" } : null;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** "FRI, 15 SEP" for the event card's badge. */
function dateBadge(date) {
  if (!date) return "";
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()].toUpperCase()}`;
}

/**
 * A tier's booking fee as `{ label, type, value }`, or null when it has none.
 * Mirrors clubpass-subscribe/lib/tickets.mjs, which is what actually charges it.
 */
function feeOf(tier) {
  const value = Number(tier?.fee_value);
  if (tier?.fee_enabled !== true || !(value > 0)) return null;

  return {
    label: (tier.fee_label ?? "").trim() || "Booking Fee",
    type: tier.fee_type === "percentage" ? "percentage" : "flat",
    value,
  };
}

/** The fee on one ticket of this tier, in dollars — worked the same way as the Lambda. */
export function unitFeeOf(tier) {
  const fee = tier?.fee;
  if (!fee) return 0;

  const cents =
    fee.type === "percentage"
      ? Math.round(Math.round(Number(tier.price) * 100) * (fee.value / 100))
      : Math.round(fee.value * 100);

  return cents / 100;
}

/**
 * An event's tiers from its `tiers` list. A tier's id is "t<entry id>", which
 * survives renaming and reordering.
 */
function tiersOf(row) {
  return (row.tiers ?? [])
    .filter((tier) => tier.price != null)
    .map((tier) => ({
      id: `t${tier.id}`,
      label: (tier.title ?? "").trim() || "Ticket",
      description: tier.description ?? "",
      memberOnly: tier.member_only === true,
      price: tier.price,
      fee: feeOf(tier),
      maxQty: tier.user_limit ?? null,
      stockLeft: tier.global_limit ?? null,
      from: tier.from_date ?? null,
      to: tier.to_date ?? null,
      salePeriod: salePeriod(tier.from_date, tier.to_date),
      status: windowStatus(tier.from_date, tier.to_date),
    }));
}

/**
 * The non-member price the card quotes: whatever a buyer would actually pay
 * today, so the cheapest tier currently on sale — falling back to the
 * cheapest of them when nothing is open yet.
 */
function publicTierOf(tiers) {
  const open = tiers.filter((tier) => !tier.memberOnly);
  if (!open.length) return null;

  const onSale = open.filter((tier) => tier.status === "active");
  const pool = onSale.length ? onSale : open;

  return pool.reduce((cheapest, tier) => (tier.price < cheapest.price ? tier : cheapest));
}

function normalise(row) {
  const startsAt = row.date ? new Date(row.date) : null;

  const tiers = tiersOf(row);

  const media = (row.banners ?? []).map(banner).filter(Boolean);
  const prices = tiers.map((tier) => tier.price);

  // What the card leads with: the member price against the best public one.
  // With several member-only tiers, the cheapest is the one worth quoting.
  const memberTiers = tiers.filter((tier) => tier.memberOnly);
  const memberTier = memberTiers.length
    ? memberTiers.reduce((cheapest, tier) => (tier.price < cheapest.price ? tier : cheapest))
    : null;
  const publicTier = publicTierOf(tiers);

  const memberSaving =
    memberTier && publicTier && publicTier.price > memberTier.price
      ? Math.round(((publicTier.price - memberTier.price) / publicTier.price) * 100)
      : 0;

  return {
    id: row.documentId,
    dateBadge: dateBadge(startsAt),
    memberTier,
    publicTier,
    memberSaving,
    // The best rate anyone could earn on this ticket — a member's 3%, scaled
    // to coins the same way the ticket flow does.
    memberCoins: memberTier ? Math.round(memberTier.price * 0.03 * 1000) : null,
    title: row.title ?? "",
    // Private events stay off the home page grid but keep working by link.
    // Entries saved before this field existed have it empty: treat as public.
    isPublic: row.isPublic !== false,
    description: row.description ?? "",
    startsAt,
    date: startsAt ? dayFormat.format(startsAt) : "",
    // "10:00 pm" reads as "10:00 PM" everywhere else in the designs.
    time: startsAt ? `${timeFormat.format(startsAt).toUpperCase()} onwards` : "",
    venue: row.venue?.name ?? "",
    address: row.venue?.address ?? "",
    mapsUrl: row.venue?.map_link || null,
    media,
    // Stills only: the card and the checkout thumbnail are <img>, and a video
    // URL in one of those renders as a broken image.
    images: media.filter((item) => item.type === "image").map((item) => item.url),
    tiers,
    priceFrom: prices.length ? Math.min(...prices) : null,
    // What a ticket costs without any discount, for the "you saved" line: the
    // dearest tier anyone can buy without a membership.
    fullPrice:
      tiers.filter((tier) => !tier.memberOnly).reduce((dearest, tier) => Math.max(dearest, tier.price), 0) ||
      (prices.length ? Math.max(...prices) : null),
  };
}

// One request serves the grid, the event page and the ticket page — but only
// briefly, so CMS edits and stock sold since show up without a hard reload.
const CACHE_MS = 30_000;
let pending = null;
let fetchedAt = 0;

export function fetchTickets() {
  if (pending && Date.now() - fetchedAt > CACHE_MS) pending = null;

  if (!pending) {
    fetchedAt = Date.now();
    pending = (async () => {
      // Soonest event first, and every published event rather than Strapi's
      // default page of 25 (its maxLimit is 100).
      const res = await fetch(`${BASE_URL}/api/tickets?populate=*&sort=date:asc&pagination[pageSize]=100`, {
        headers: {
          "Content-Type": "application/json",
          ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
        },
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.error?.message ?? `Couldn't load events (${res.status})`);
      }

      return (body?.data ?? []).map(normalise);
    })();

    // A failed load shouldn't be cached — the next mount should retry.
    pending.catch(() => {
      pending = null;
    });
  }

  return pending;
}

export async function fetchTicketById(id) {
  const tickets = await fetchTickets();
  return tickets.find((ticket) => ticket.id === id) ?? null;
}
