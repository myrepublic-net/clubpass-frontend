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
  "&populate[before_ticket_section][populate]=*" +
  "&populate[after_ticket_section][populate]=*" +
  "&populate[cta_section][populate]=*" +
  "&populate[faq_section][populate]=*" +
  // Named populates here rather than "*": benefits carry an image that needs
  // its own level, and naming one sibling stops Strapi populating the rest —
  // so ticket has to be listed too or the ticket card comes back empty.
  "&populate[clubpass_beta_section][populate][benefits][populate]=*" +
  "&populate[clubpass_beta_section][populate][ticket][populate]=*" +
  // how_it_works[populate]=* stops one level short of each step's two images,
  // so steps is named — which means the section image has to be named too.
  "&populate[how_it_works][populate][steps][populate]=*" +
  "&populate[how_it_works][populate][image]=true";

/**
 * The best size of an upload to show. Strapi only generates a format when the
 * original is bigger than it, so with no large or medium the original is
 * already modest — use it rather than the downscaled "small", which is lower
 * resolution and can even be heavier (the FAQ bus: small 177 KB, original 48 KB).
 */
function mediaUrl(item) {
  return (
    item?.formats?.large?.url ??
    item?.formats?.medium?.url ??
    item?.url ??
    item?.formats?.small?.url ??
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
  const after = data?.after_ticket_section;
  const cta = data?.cta_section;
  const faq = data?.faq_section;
  const beta = data?.clubpass_beta_section;
  const why = data?.why_section;
  const howItWorks = data?.how_it_works;

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
    // The two notes and the small print under the venue grid.
    afterTickets: after
      ? {
          items: [
            { id: "info-1", icon: mediaUrl(after.icon1), title: after.title1 ?? "", text: after.description1 ?? "" },
            { id: "info-2", icon: mediaUrl(after.icon2), title: after.title2 ?? "", text: after.description2 ?? "" },
          ],
          declaration: after.declaration ?? "",
        }
      : null,
    // The closing "be one of the first 150" band.
    cta: cta
      ? {
          heading: cta.heading ?? "",
          description: cta.description ?? "",
          buttonText: cta.button_text ?? "",
          buttonLink: cta.button_link ?? "",
          image: mediaUrl(cta.image),
        }
      : null,
    // The founding-member section and its ticket card.
    beta: beta
      ? {
          kicker: beta.title ?? "",
          heading: beta.heading ?? "",
          description: beta.description ?? "",
          benefits: (beta.benefits ?? []).map((benefit) => ({
            id: benefit.id,
            text: benefit.title ?? "",
            image: mediaUrl(benefit.image),
          })),
          ticket: {
            title: beta.ticket?.title ?? "",
            tag: beta.ticket?.tag ?? "",
            heading: beta.ticket?.heading ?? "",
            description: beta.ticket?.description ?? "",
            price: beta.ticket?.price ?? "",
            uptoPrice: beta.ticket?.upto_price ?? "",
            activeTag: beta.ticket?.active_tag ?? "",
            buttonText: beta.ticket?.button_text ?? "",
            buttonLink: beta.ticket?.button_link ?? "",
            info: beta.ticket?.info ?? "",
            declaration: beta.ticket?.declaration ?? "",
          },
        }
      : null,
    faq: faq
      ? {
          kicker: faq.title ?? "",
          heading: faq.heading ?? "",
          description: faq.description ?? "",
          otherInfo: faq.other_info ?? "",
          image: mediaUrl(faq.image),
          items: (faq.faqs ?? []).map((item) => ({
            id: item.id,
            question: item.title ?? "",
            answer: item.body ?? "",
          })),
        }
      : null,
    howItWorks: howItWorks
      ? {
          eyebrow: howItWorks.title ?? "",
          heading: howItWorks.heading ?? "",
          paragraph: howItWorks.paragraph ?? "",
          image: mediaUrl(howItWorks.image),
          steps: (howItWorks.steps ?? []).map((step) => ({
            id: step.id,
            title: step.heading ?? "",
            text: step.description ?? "",
            // step_image is the big number, image the small illustration under it.
            img: mediaUrl(step.step_image),
            meta: mediaUrl(step.image),
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
