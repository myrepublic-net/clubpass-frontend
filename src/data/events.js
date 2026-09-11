/**
 * Partner-venue events shown from the "View event details" row on each
 * ClubPass.jsx venue card. Keyed by the same id used in the route
 * (/events/:id) and in each card's Link target.
 */
export const EVENTS = {
  emporium: {
    id: "emporium",
    venue: "Emporium",
    title: "Emporium Saturdays: Resident Nights",
    address: "#01-01, 100 Amoy Street, Singapore 069920",
    mapsUrl: "https://maps.google.com/?q=Emporium+Singapore",
    date: "Saturday, 23 September",
    time: "10:00 PM onwards",
    images: ["/images/free-one.png", "/images/cb-one.png", "/images/cb-two.png"],
    priceFrom: 35,
    description:
      "Emporium's resident DJs take over the decks for a night of house and techno in the heart of the club district. Clubpass members walk in free — flash your pass at the door.\n\n" +
      "Expect a packed dance floor, guest sets from the city's best selectors, and the usual Emporium hospitality.",
  },
  zouk: {
    id: "zouk",
    venue: "Zouk",
    title: "Zouk Fridays: Mainroom Sessions",
    address: "3C River Valley Road, Clarke Quay, Singapore 179022",
    mapsUrl: "https://maps.google.com/?q=Zouk+Singapore",
    date: "Friday, 22 September",
    time: "10:00 PM onwards",
    images: ["/images/free-two.png", "/images/cb-three.png", "/images/cb-four.png"],
    priceFrom: 30,
    description:
      "Zouk's mainroom hosts a rotating line-up of local and international selectors every Friday. Clubpass members skip the queue and walk in free.\n\n" +
      "Full production, a packed crowd, and one of the city's most iconic rooms.",
  },
  "marquee-singapore": {
    id: "marquee-singapore",
    venue: "Marquee Singapore",
    title: "Marquee Special: Steve Aoki Live",
    address: "The Shoppes at Marina Bay Sands, Level 1, Singapore 018956",
    mapsUrl: "https://maps.google.com/?q=Marquee+Singapore",
    date: "Saturday, 23 September",
    time: "10:00 PM onwards",
    images: ["/images/free-three.png", "/images/dj-decks.png", "/images/island.png"],
    priceFrom: 45,
    description:
      "Experience an unforgettable night with Steve Aoki at Marquee Singapore. Featuring world-class production, immersive visuals, and a set list built for the biggest room in the city.\n\n" +
      "Clubpass members get free entry — present your pass at the VIP line to skip the queue.",
  },
  "kilo-lounge": {
    id: "kilo-lounge",
    venue: "Kilo Lounge",
    title: "Kilo Lounge: Late Night Sessions",
    address: "8 Empress Place, Singapore 179556",
    mapsUrl: "https://maps.google.com/?q=Kilo+Lounge+Singapore",
    date: "Saturday, 23 September",
    time: "11:00 PM onwards",
    images: ["/images/free-four.png", "/images/cb-one.png", "/images/cb-three.png"],
    priceFrom: 25,
    description:
      "An intimate room with a big sound system — Kilo Lounge runs deep house and disco sets until sunrise. Clubpass members are on the list, no cover.\n\n" +
      "Arrive after 1am for the room at its best.",
  },
};

export function getEventById(id) {
  return EVENTS[id] ?? null;
}
