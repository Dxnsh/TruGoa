import {
  Plane,
  Hotel,
  UtensilsCrossed,
  Compass,
  Sunset,
  MoonStar,
  Gift,
} from "lucide-react";

/* A new tourist's trip, stage by stage — arrival to departure. */
export const JOURNEY_STAGES = [
  {
    id: 1,
    icon: Plane,
    title: "Just Landed",
    desc: "Airport help, transport, SIM cards, essentials & local tips.",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80",
    steps: [
      { label: "Pre-paid taxi counter", detail: "₹600–₹1,100 to North Goa. Never pay outside touts." },
      { label: "Get a SIM card",        detail: "Airtel or Jio — buy at airport arrivals, ₹200–₹350." },
      { label: "First night stay",      detail: "Book near Calangute or Palolem depending on your vibe." },
      { label: "Cash & ATMs",           detail: "Withdraw inside the airport. City ATMs can have skimmers." },
    ],
  },
  {
    id: 2,
    icon: Hotel,
    title: "Where to Stay",
    desc: "North or South Goa? Find stays that match your style & budget.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80",
    steps: [
      { label: "North Goa",    detail: "Baga, Anjuna, Vagator — lively, lots of options." },
      { label: "South Goa",    detail: "Palolem, Agonda — quieter, more beautiful beaches." },
      { label: "Panaji stay",  detail: "Best base for heritage, ferries, and culture." },
      { label: "Budget tip",   detail: "Book directly — hotels offer 15–20% off vs OTAs." },
    ],
  },
  {
    id: 3,
    icon: UtensilsCrossed,
    title: "Taste Goa",
    desc: "Local food, seafood, hidden cafés & places locals actually love.",
    image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=500&q=80",
    steps: [
      { label: "Fish curry rice",  detail: "Goa's national dish. Best at Ritz Classic, Panaji (₹250)." },
      { label: "Beach shack rule", detail: "Always ask price before ordering drinks." },
      { label: "Bebinca",          detail: "16-layer Goan dessert. Infantaria Cafe, 8am–10:30am only." },
      { label: "Feni",             detail: "Local cashew spirit. Try once at any beach shack." },
    ],
  },
  {
    id: 4,
    icon: Compass,
    title: "Explore Goa",
    desc: "Beaches, waterfalls, forts, heritage, markets & adventures.",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&q=80",
    steps: [
      { label: "Dudhsagar Falls",  detail: "Book only official jeep at Mollem check post. ₹800–₹1,200." },
      { label: "Chapora Fort",     detail: "Go at 5:45am — magical views, zero crowd." },
      { label: "Scooter rental",   detail: "₹350–₹600/day. Photograph every scratch before leaving." },
      { label: "Divar Island",     detail: "Free government ferry. Zero tourists. Hidden Goa." },
    ],
  },
  {
    id: 5,
    icon: Sunset,
    title: "Sunset Spots",
    desc: "Best sunset views, romantic places & photography locations.",
    image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&q=80",
    steps: [
      { label: "Chapora Fort",       detail: "Best panoramic sunset. Arrive 45min before sundown." },
      { label: "Thalassa cliff",     detail: "Greek restaurant on Vagator cliff. Book ahead." },
      { label: "Palolem from water", detail: "Kayak out 200m as sun sets. Life-changing view." },
      { label: "Cabo de Rama Fort",  detail: "Ocean on 3 sides. Completely free, almost no crowd." },
    ],
  },
  {
    id: 6,
    icon: MoonStar,
    title: "Goa After Dark",
    desc: "Nightlife, live music, beach parties & cozy evening cafés.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80",
    steps: [
      { label: "Tito's Lane, Baga",     detail: "Goa's most famous nightlife strip. Go after 10pm." },
      { label: "Silent disco Palolem",  detail: "Headphone party on the beach. Unique experience." },
      { label: "Saturday Night Market", detail: "Arpora, Nov–April. 800+ stalls, live music, food." },
      { label: "Safety note",           detail: "Never accept drinks from strangers. Use licensed transport." },
    ],
  },
  {
    id: 7,
    icon: Gift,
    title: "Before You Leave",
    desc: "Shopping, souvenirs, cashews, spices & things not to miss.",
    image: "https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=500&q=80",
    steps: [
      { label: "Cashews",           detail: "Buy from Mapusa Market — far cheaper than airport shops." },
      { label: "Goan spices",       detail: "Sahakari Spice Farm sells direct. Best prices." },
      { label: "Feni to take home", detail: "Legally carry 2 bottles. Pick up at Mapusa liquor shops." },
      { label: "Airport timing",    detail: "Dabolim: arrive 2.5hrs early. Mopa: 2hrs. Both get busy." },
    ],
  },
];
