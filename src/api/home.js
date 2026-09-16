/**
 * The home page's editorial content from Strapi — everything above the venue
 * grid: the hero slides, the "more perks" band and the why-Clubpass compare.
 *
 * It's one single-type entry, so the deep `populate` below is what pulls the
 * nested components and their media back in one request.
 */

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";

const TOKEN = import.meta.env.VITE_STRAPI_TOKEN_GET;

const QUERY =
  "populate[hero_section][populate]=*" +
  "&populate[why_section][populate][cons][populate]=*" +
  "&populate[why_section][populate][pro][populate]=*" +
  "&populate[before_ticket_section][populate]=*";

/** Largest format Strapi generated, falling back to the original upload. */
function mediaUrl(item) {
  return (
    item?.formats?.large?.url ??
    item?.formats?.medium?.url ??
    item?.formats?.small?.url ??
    item?.url ??
    null
  );
}

/**
 * The compare list's pill colours. Strapi stores an intent ("green"/"red"),
 * the stylesheet names them after what they meant originally.
 */
const PILL_CLASS = {
  green: "cl-box available",
  red: "cl-box coming-soon",
};

function normalise(data) {
  const hero = (data?.hero_section ?? []).map((slide) => ({
    id: slide.id,
    image: mediaUrl(slide.backgroundImage),
    title: slide.heading1 ?? "",
    accent: slide.heading2 ?? "",
    text: slide.paragraph ?? "",
    linkText: slide.link_text ?? "",
    linkUrl: slide.link_url ?? "",
    buttonText: slide.button_text ?? "",
    buttonLink: slide.button_link ?? "",
  }));

  const before = data?.before_ticket_section;
  const why = data?.why_section;

  const items = (side) =>
    (side?.items ?? []).map((item) => ({
      id: item.id,
      text: item.title ?? "",
      pill: item.tag ?? null,
      pillClass: PILL_CLASS[item.color] ?? "cl-box coming-oct",
    }));

  return {
    hero,
    beforeTickets: before
      ? {
          badge: before.badge_text ?? "",
          heading: before.heading ?? "",
          description: before.description ?? "",
          image: before.section_image?.url ?? "",
          benefits: (before.benefits ?? []).map((benefit) => ({
            id: benefit.id,
            text: benefit.title ?? "",
          })),
        }
      : null,
    why: why
      ? {
          eyebrow: why.title ?? "",
          heading: why.heading ?? "",
          description: why.description ?? "",
          consHeading: why.cons?.heading ?? "",
          cons: items(why.cons),
          proHeading: why.pro?.heading ?? "",
          pro: items(why.pro),
        }
      : null,
  };
}

let pending = null;

export function fetchHome() {
  if (!pending) {
    pending = (async () => {
      const res = await fetch(`${BASE_URL}/api/home?${QUERY}`, {
        headers: {
          "Content-Type": "application/json",
          ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
        },
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.error?.message ?? `Couldn't load the home page (${res.status})`);
      }

      return normalise(body?.data);
    })();

    pending.catch(() => {
      pending = null;
    });
  }

  return pending;
}
