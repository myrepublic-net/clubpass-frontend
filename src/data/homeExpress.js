/**
 * The Home Express route, schedule and stop details.
 *
 * Kept as data rather than markup so the dashboard, the marketing page and
 * anything later all describe the same route from one place.
 *
 * PLACEHOLDER CONTENT: departure times, pickup instructions and photos are
 * stand-ins. Replace them with the operator's real details — every string here
 * is shown to members as fact.
 */

export const SCHEDULE = {
  nights: "Friday & Saturday nights",
  cadence: "4 operating nights every month",
  window: "Departures 01:00 – 03:00",
};

/**
 * City pick-up loop, in the order the coach calls at them. `photo` and
 * `instructions` are what the bottom sheet shows when a member taps a stop.
 */
export const PICKUPS = [
  {
    id: "mbs",
    name: "Marina Bay Sands",
    time: "01:00",
    photo: "/images/pickups/mbs.jpg",
    instructions:
      "Taxi bay outside the Event Plaza, by the waterfront steps. The coach waits in the second bay — look for the ClubPass sign in the windscreen.",
    mapUrl: "https://maps.google.com/?q=Marina+Bay+Sands+Event+Plaza+Singapore",
  },
  {
    id: "celavi",
    name: "CÉ LA VI",
    time: "01:15",
    photo: "/images/pickups/celavi.jpg",
    instructions:
      "Tower 3 drop-off point at street level, not the SkyPark exit. Take the lift down and walk out towards Bayfront Avenue.",
    mapUrl: "https://maps.google.com/?q=CE+LA+VI+Singapore",
  },
  {
    id: "clarke-quay",
    name: "Clarke Quay",
    time: "01:35",
    photo: "/images/pickups/clarke-quay.jpg",
    instructions:
      "River Valley Road side, outside Block A. The coach pulls in past the taxi queue — stand clear of the rank.",
    mapUrl: "https://maps.google.com/?q=Clarke+Quay+Singapore",
  },
  {
    id: "boat-quay",
    name: "Boat Quay",
    time: "01:50",
    photo: "/images/pickups/boat-quay.jpg",
    instructions:
      "Circular Road end, by the pedestrian crossing. Bollards block the quay itself, so the coach stops on the road.",
    mapUrl: "https://maps.google.com/?q=Boat+Quay+Singapore",
  },
  {
    id: "zouk",
    name: "Zouk",
    time: "02:10",
    photo: "/images/pickups/zouk.jpg",
    instructions:
      "Jiak Kim Street entrance, past the queue barriers. Last pick-up of the loop — the coach leaves for the East from here.",
    mapUrl: "https://maps.google.com/?q=Zouk+Singapore",
  },
];

/** Drop-offs are MRT stations and need no further explanation. */
export const DROPOFFS = [
  { id: "paya-lebar", name: "Paya Lebar MRT" },
  { id: "bedok", name: "Bedok MRT" },
  { id: "tampines", name: "Tampines MRT" },
  { id: "pasir-ris", name: "Pasir Ris MRT" },
];

/** Where "Track Bus" goes. Set VITE_BUS_TRACKING_URL per environment. */
export const TRACKING_URL = import.meta.env.VITE_BUS_TRACKING_URL ?? "";

/** Home Express FAQ / support. */
export const SUPPORT_URL =
  import.meta.env.VITE_SUPPORT_URL ?? "https://www.rewardland.sg/contact-us";

/** The plan, as shown on the subscription card. Matches the PayPal billing plan. */
export const PLAN = {
  name: "ClubPass · Home Express",
  price: import.meta.env.VITE_CLUBPASS_PRICE ?? "19.90",
  currency: import.meta.env.VITE_PAYPAL_CURRENCY ?? "SGD",
  cycle: "Monthly",
};
