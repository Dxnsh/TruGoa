import "dotenv/config";
import mongoose from "mongoose";
import Business from "../models/Business.js";

const PLACES = [
  // ── Editor's Picks (beach / heritage / activity mix, tagged editors-pick) ──
  {
    name: "Fontainhas Heritage Walk",
    category: "heritage",
    tagline: "A morning stroll through Goa's Latin Quarter",
    description: "Cobbled lanes, Portuguese-era townhouses in ochre and azure, and small chapels tucked between them — Fontainhas is Panaji's oldest neighbourhood and its most photogenic.",
    location: "Fontainhas, Panaji",
    area: "panaji",
    priceRange: "Free to walk",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&q=80",
    tags: ["editors-pick", "heritage", "walking"],
    status: "approved",
    featured: true,
    editorPick: true,
  },
  {
    name: "Old Quarter Kitchen",
    category: "restaurant",
    tagline: "12 Goan dishes you must try",
    description: "A no-frills kitchen serving the Goan classics done right — recheado fish, xacuti, and a prawn balchão that regulars swear by.",
    location: "Mala, Panaji",
    area: "panaji",
    priceRange: "₹400–₹800 per person",
    priceLevel: "mid",
    heroImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80",
    tags: ["editors-pick", "food"],
    status: "approved",
    featured: true,
    editorPick: true,
  },
  {
    name: "Dudhsagar Secret Falls",
    category: "activity",
    tagline: "Secret waterfalls only locals know about",
    description: "A quieter, less-touristed approach to Goa's waterfall country — a trek through forest to a cascade most visitors never find.",
    location: "Mollem, South Goa",
    area: "south-goa",
    priceRange: "₹500 guide fee",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&q=80",
    tags: ["editors-pick", "hidden"],
    status: "approved",
    featured: true,
    editorPick: true,
  },

  // ── Stays in Goa ──
  {
    name: "Cape Goa Boutique Villa",
    category: "hotel",
    subCategory: "boutique hotel",
    tagline: "Boutique Hotels",
    description: "A restored Portuguese villa turned nine-room boutique stay, with a courtyard pool and a kitchen that only cooks what's fresh that morning.",
    location: "Assagao, North Goa",
    area: "north-goa",
    priceRange: "₹8,000–₹14,000 per night",
    priceLevel: "premium",
    heroImage: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80",
    tags: ["stays"],
    status: "approved",
  },
  {
    name: "Elsewhere Beach Resort",
    category: "hotel",
    subCategory: "beach resort",
    tagline: "Beach Resorts",
    description: "Cliffside rooms with uninterrupted sea views and a private stretch of sand — the kind of resort built for doing absolutely nothing.",
    location: "Vagator, North Goa",
    area: "north-goa",
    priceRange: "₹12,000–₹20,000 per night",
    priceLevel: "premium",
    heroImage: "https://images.unsplash.com/photo-1520250497591-112f2af3325a?w=1200&q=80",
    tags: ["stays"],
    status: "approved",
  },
  {
    name: "Palm Grove Homestay",
    category: "stay",
    subCategory: "homestay",
    tagline: "Homestays",
    description: "A family-run homestay in a coconut grove — home-cooked meals, hammocks, and hosts who'll draw you a better map than Google Maps will.",
    location: "Agonda, South Goa",
    area: "south-goa",
    priceRange: "₹2,000–₹4,000 per night",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80",
    tags: ["stays"],
    status: "approved",
  },

  // ── Food & Drink ──
  {
    name: "Sal's Local Goan Kitchen",
    category: "restaurant",
    subCategory: "local goan food",
    tagline: "Local Goan Food",
    description: "Home-style Goan cooking — no menu translations needed, just point at what smells best.",
    location: "Siolim, North Goa",
    area: "north-goa",
    priceRange: "₹300–₹600 per person",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&q=80",
    tags: ["food"],
    status: "approved",
  },
  {
    name: "Cafe Bodega",
    category: "cafe",
    subCategory: "cafe",
    tagline: "Cafes in Goa",
    description: "Slow mornings, good filter coffee, and a garden seating area shaded by banyan trees.",
    location: "Assagao, North Goa",
    area: "north-goa",
    priceRange: "₹250–₹500 per person",
    priceLevel: "mid",
    heroImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    tags: ["food"],
    status: "approved",
  },
  {
    name: "Antares Beach Shack",
    category: "restaurant",
    subCategory: "beach shack",
    tagline: "Best Beach Shacks",
    description: "Feet-in-the-sand dining with a cocktail menu that outshines the food — in the best way.",
    location: "Vagator Beach, North Goa",
    area: "north-goa",
    priceRange: "₹800–₹1,500 per person",
    priceLevel: "mid",
    heroImage: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
    tags: ["food"],
    status: "approved",
  },
  {
    name: "Villa Blanche",
    category: "restaurant",
    subCategory: "fine dining",
    tagline: "Fine Dining",
    description: "A candlelit courtyard restaurant plating modern European food with Goan ingredients.",
    location: "Anjuna, North Goa",
    area: "north-goa",
    priceRange: "₹2,000–₹3,500 per person",
    priceLevel: "premium",
    heroImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    tags: ["food"],
    status: "approved",
  },
  {
    name: "Mum's Bakery",
    category: "cafe",
    subCategory: "bakery",
    tagline: "Bakeries",
    description: "Fresh poi bread every morning and the best bebinca in the neighbourhood.",
    location: "Margao, South Goa",
    area: "south-goa",
    priceRange: "₹100–₹300 per person",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    tags: ["food"],
    status: "approved",
  },

  // ── Hidden Gems ──
  {
    name: "Keri Caves",
    category: "heritage",
    tagline: "An ancient cave carved into the cliffside",
    description: "A rock-cut Buddhist cave overlooking the Arabian Sea, rarely visited and easy to miss unless you know the turn-off.",
    location: "Keri, North Goa",
    area: "north-goa",
    priceRange: "Free",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
    tags: ["hidden"],
    status: "approved",
  },
  {
    name: "Netravali Wildlife Sanctuary",
    category: "activity",
    tagline: "Untouched forest and a bubbling lake",
    description: "Dense Western Ghats forest, a rare bubbling lake formation, and hardly any other visitors.",
    location: "Netravali, South Goa",
    area: "south-goa",
    priceRange: "₹50 entry",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    tags: ["hidden"],
    status: "approved",
  },
  {
    name: "Hollant Beach",
    category: "beach",
    tagline: "A near-empty beach minutes from the crowds",
    description: "A short walk from Bogmalo, but a different world — no vendors, no crowds, just black sand cliffs and calm water.",
    location: "Bogmalo, South Goa",
    area: "south-goa",
    priceRange: "Free",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80",
    tags: ["hidden"],
    status: "approved",
  },
  {
    name: "Chorao Island",
    category: "heritage",
    tagline: "Mangroves, birdlife and an old church, no crowds",
    description: "A five-minute ferry ride from Panaji into a slower island — the Salim Ali Bird Sanctuary and a 16th-century church.",
    location: "Chorao, Panaji",
    area: "panaji",
    priceRange: "₹10 ferry fare",
    priceLevel: "budget",
    heroImage: "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800&q=80",
    tags: ["hidden"],
    status: "approved",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  let created = 0;
  for (const place of PLACES) {
    const exists = await Business.findOne({ name: place.name });
    if (exists) {
      console.log(`Skip (exists): ${place.name}`);
      continue;
    }
    await Business.create(place);
    created++;
    console.log(`Created: ${place.name}`);
  }

  console.log(`\nDone. ${created} businesses created, ${PLACES.length - created} skipped.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
