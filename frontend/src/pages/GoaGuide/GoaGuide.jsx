import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../../services/api";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../../components/LoginModal/LoginModal";
import SEO from "../../components/SEO/SEO";
import useIsMobile from "../../hooks/useIsMobile";
import "./GoaGuide.css";


const GOA = {
  taxi: [
    { from: "Airport (Dabolim)", to: "Panaji",           price: "₹600–₹800",   time: "45 min", tip: "Use the pre-paid counter inside — never the touts outside." },
    { from: "Airport (Dabolim)", to: "Baga / Calangute", price: "₹900–₹1,100", time: "55 min", tip: "Meters are rarely used. Fix price before boarding." },
    { from: "Airport (Dabolim)", to: "Anjuna / Vagator", price: "₹1,000–₹1,200",time: "60 min", tip: "Ola/Uber available but surge-priced at arrivals." },
    { from: "Airport (Dabolim)", to: "Palolem / Agonda", price: "₹1,800–₹2,200",time: "2 hrs",  tip: "Shared cabs exist — ask at pre-paid counter." },
    { from: "Airport (Dabolim)", to: "Colva / Benaulim", price: "₹400–₹550",   time: "25 min", tip: "Closest beach to airport. Short ride." },
    { from: "Panaji",            to: "Baga Beach",       price: "₹350–₹500",   time: "30 min", tip: "Rapido bikes are ₹120–₹180 if going solo." },
    { from: "Panaji",            to: "Old Goa / Basilica",price: "₹150–₹250",  time: "15 min", tip: "Ferries from Betim are free and scenic." },
    { from: "Calangute",         to: "Anjuna",            price: "₹200–₹300",   time: "15 min", tip: "Wednesday flea market — expect surge pricing." },
    { from: "Mapusa",            to: "Vagator / Chapora", price: "₹200–₹300",   time: "20 min", tip: "Mapusa Friday market day — autos wait at bus stand." },
    { from: "Margao",            to: "Colva Beach",       price: "₹150–₹200",   time: "15 min", tip: "Local autos are cheaper than taxis for this short route." },
    { from: "Panaji",            to: "Arambol Beach",     price: "₹700–₹900",   time: "60 min", tip: "Far north. Consider renting a scooter instead." },
    { from: "Any location",      to: "Scooter rental/day",price: "₹350–₹600",   time: "—",      tip: "Royal Enfield rental: ₹600–₹900/day. Always check brakes first." },
  ],

  restaurants: [
    {
      name: "Ritz Classic",
      area: "Panaji, near Municipal Garden",
      type: "Local Goan",
      budget: "₹250–₹450/person",
      rating: 4.7,
      hours: "11 AM – 3:30 PM, 7 PM – 10:30 PM. Closed Sun.",
      mustOrder: "Fish curry rice (the definitive version), Prawn recheado, Crab xec xec",
      localTip: "This is where Panaji locals eat. The fish curry rice here is considered the gold standard in Goa. Go at 12:30pm — the freshest catch is served first.",
      avoid: "Don't order North Indian food here. Come for the Goan only.",
      verified: true,
    },
    {
      name: "Thalassa",
      area: "Small Vagator Beach, North Goa",
      type: "Greek / Mediterranean",
      budget: "₹800–₹1,600/person",
      rating: 4.5,
      hours: "12 PM – 11 PM. Closed Mon. Nov–April only.",
      mustOrder: "Moussaka, Grilled octopus, Lamb souvlaki, Santorini sunsets (cocktail)",
      localTip: "Book the cliff-side table 3 days ahead for sunset. The view of Vagator beach from here at golden hour is genuinely extraordinary — worth the premium.",
      avoid: "Avoid July–October (monsoon — closed or scaled down).",
      verified: true,
    },
    {
      name: "Gunpowder",
      area: "Assagao, North Goa",
      type: "South Indian / Kerala cuisine",
      budget: "₹600–₹1,000/person",
      rating: 4.6,
      hours: "12 PM – 3:30 PM, 7 PM – 10:30 PM. Closed Tue.",
      mustOrder: "Kerala fish curry, Appam with stew, Chettinad chicken, Pandi curry",
      localTip: "Assagao's most beloved restaurant. The heritage Portuguese villa setting is as good as the food. Go for lunch — quieter and better service.",
      avoid: "Don't arrive without reservation on weekends.",
      verified: true,
    },
    {
      name: "Antares",
      area: "Vagator Cliff, North Goa",
      type: "Modern European / Seafood",
      budget: "₹1,200–₹2,000/person",
      rating: 4.4,
      hours: "1 PM – 11 PM.",
      mustOrder: "Butter garlic lobster, Tiger prawn pasta, Catch of the day (ask the server)",
      localTip: "Chef Sarah Todd's restaurant. Sunset cocktails on the deck overlooking the Arabian Sea — one of the most dramatic restaurant settings in all of India.",
      avoid: "Expensive by Goa standards. Not a budget option.",
      verified: true,
    },
    {
      name: "Infantaria",
      area: "Baga-Calangute junction, North Goa",
      type: "Bakery / Café / Breakfast",
      budget: "₹150–₹350/person",
      rating: 4.5,
      hours: "7:30 AM – 11 PM.",
      mustOrder: "Bebinca (the Goan layered dessert), Croissants, Goan sausage sandwich, Caramel custard",
      localTip: "The best breakfast in North Goa, full stop. The bebinca here has been made the same way for 40 years. Go between 8–10 AM for fresh bakes.",
      avoid: "Lunchtime crowds are brutal. Come early.",
      verified: true,
    },
    {
      name: "Vinayak Family Restaurant",
      area: "Assagao / Mapusa Road, North Goa",
      type: "Local Goan",
      budget: "₹200–₹350/person",
      rating: 4.6,
      hours: "11 AM – 3 PM, 6 PM – 10 PM.",
      mustOrder: "Prawn balchão (spicy pickled prawn), Sorpotel, Chicken cafreal, Sol kadhi",
      localTip: "Where Goan families eat on Sunday. No frills, no Instagram aesthetic — just exceptional home-style cooking. The prawn balchão is the best in Goa.",
      avoid: "Cash only. No UPI. Carry notes.",
      verified: true,
    },
    {
      name: "Black Sheep Bistro",
      area: "Panaji city centre",
      type: "Modern Indian fine dining",
      budget: "₹1,000–₹1,800/person",
      rating: 4.7,
      hours: "12 PM – 3 PM, 7 PM – 11 PM. Closed Mon.",
      mustOrder: "Kokum-glazed duck, Goan sausage risotto, The entire tasting menu (₹2,200)",
      localTip: "Panaji's finest restaurant. Chef Prasson Mahanta uses hyper-local Goan ingredients in contemporary ways. The tasting menu is a genuine culinary journey through Goa.",
      avoid: "Reservation essential on weekends. Book 5 days ahead.",
      verified: true,
    },
    {
      name: "Fisherman's Wharf",
      area: "Cavelossim, South Goa",
      type: "Seafood / Goan",
      budget: "₹500–₹900/person",
      rating: 4.3,
      hours: "12 PM – 11 PM.",
      mustOrder: "Grilled tiger prawns, Kingfish recheado, Clam curry",
      localTip: "The riverside setting on the Sal River is the attraction. Go for the 6 PM sunset with a feni sour. Seafood is fresh daily from local fishermen.",
      avoid: "Touristy — prices reflect the view, not just the food.",
      verified: true,
    },
  ],

  cafes: [
    {
      name: "Café Bodega",
      area: "Altinho, Panaji",
      type: "Heritage café / All-day dining",
      budget: "₹300–₹600/person",
      rating: 4.6,
      hours: "9 AM – 7 PM. Closed Mon.",
      mustOrder: "Avocado toast (sounds generic but exceptional here), Cold brew, Portuguese egg tarts, House-made granola",
      localTip: "Inside the Sunaparanta Centre for the Arts — a restored 1840s Portuguese mansion with a garden courtyard. The most beautiful café setting in Panaji. Half art gallery, half café.",
      verified: true,
    },
    {
      name: "Bean Me Up",
      area: "Siolim, North Goa",
      type: "Organic / Vegan café",
      budget: "₹300–₹600/person",
      rating: 4.4,
      hours: "8 AM – 9 PM.",
      mustOrder: "Vegan Goan fish curry (jackfruit), Smoothie bowls, Homemade sourdough",
      localTip: "Goa's best vegan café by a considerable margin. Run by a Belgian-Goan family. The garden seating under a banyan tree makes this a genuinely peaceful escape.",
      verified: true,
    },
    {
      name: "Pousada by the Beach",
      area: "Calangute Beach",
      type: "Beachside café",
      budget: "₹250–₹500/person",
      rating: 4.2,
      hours: "8 AM – 10 PM.",
      mustOrder: "Goan fish thali (lunch only), Fresh coconut water, Caipirinha",
      localTip: "Directly on Calangute beach. Best for a lazy morning coffee watching the fishing boats come in. The fish thali at lunch (₹220) is exceptional value.",
      verified: true,
    },
    {
      name: "Artjuna Garden Café",
      area: "Anjuna, North Goa",
      type: "Bohemian / Healthy",
      budget: "₹300–₹550/person",
      rating: 4.3,
      hours: "9 AM – 8 PM.",
      mustOrder: "Beet hummus bowl, Turmeric latte, Raw chocolate cake",
      localTip: "Anjuna's most beloved hangout for long-term Goa residents. Half craft store, half café. The garden is strung with fairy lights — magical at dusk.",
      verified: true,
    },
  ],

  beaches: [
    {
      name: "Palolem Beach",
      area: "Canacona, South Goa",
      type: "Crescent bay / Swimming",
      crowd: "Moderate — manageable even in peak season",
      bestTime: "6 AM – 9 AM for empty beach. December–February for best weather.",
      localTip: "Goa's most photogenic beach. The crescent shape means calm, swimmable water. Kayak to the small island at the south end — ₹400/hour.",
      hiddenAngle: "Walk 30 min south to Patnem Beach — quieter, same beautiful water, half the crowd.",
      activities: "Silent disco (Friday nights), Kayaking, Dolphin trips at dawn",
      verified: true,
    },
    {
      name: "Agonda Beach",
      area: "Canacona, South Goa",
      type: "Pristine / Nesting turtles",
      crowd: "Low — intentionally underdeveloped",
      bestTime: "Year-round. November–March for turtle nesting.",
      localTip: "The most unspoiled beach in South Goa. No jet skis, no hawkers. Olive Ridley turtles nest here November–March — beach is partially restricted at night.",
      hiddenAngle: "The north end of the beach near the rocks is where locals swim. Completely private.",
      activities: "Turtle watching, Yoga retreats, Stand-up paddleboarding",
      verified: true,
    },
    {
      name: "Butterfly Beach",
      area: "Between Palolem and Cabo de Rama, South Goa",
      type: "Hidden / Boat-access only",
      crowd: "Very low — inaccessible by road",
      bestTime: "October–April (avoid monsoon when boats don't run)",
      localTip: "Accessible only by boat from Palolem (₹300 round trip) or a 45-min trek through jungle. Named for the butterflies that gather here. Completely untouched.",
      hiddenAngle: "Go at 7 AM. The boat operators don't start until 9 AM — arrive early and you may have it completely to yourself.",
      activities: "Snorkeling, Photography, Solitude",
      verified: true,
    },
    {
      name: "Morjim Beach",
      area: "Pernem, North Goa",
      type: "Quiet / Turtle nesting / Russian community",
      crowd: "Low — one of North Goa's quietest beaches",
      bestTime: "November–March",
      localTip: "Where the Chapora River meets the sea. Olive Ridley turtle nesting site. The Russian community here means excellent borscht alongside your Kingfisher. Oddly wonderful.",
      hiddenAngle: "Cross the Chapora river mouth by local fishing boat (₹20) to reach Morjim from Chapora — a genuine adventure.",
      activities: "Turtle watching, Kitesurfing, River crossing",
      verified: true,
    },
    {
      name: "Arambol Beach",
      area: "Pernem, Far North Goa",
      type: "Alternative / Bohemian",
      crowd: "Moderate — backpacker and long-stay community",
      bestTime: "November–March",
      localTip: "Goa's most alternative beach. Walk north for 15 min to find the sweet water lake — a small freshwater lake behind the beach surrounded by trees. Sunset here with the drum circle is a Goa rite of passage.",
      hiddenAngle: "The cliffs past the sweet water lake lead to Querim Beach — completely deserted and genuinely wild.",
      activities: "Fire juggling, Drum circles at sunset, Paragliding",
      verified: true,
    },
    {
      name: "Vagator & Little Vagator",
      area: "Bardez, North Goa",
      type: "Dramatic cliffs / Party adjacent",
      crowd: "Moderate — busy at night",
      bestTime: "October–March. Sunset is extraordinary from Chapora Fort above.",
      localTip: "Two distinct beaches separated by rocky headland. Little Vagator (Ozran) is the beautiful crescent cove below the cliff. Climb the red laterite cliff for the Dilwale Dulhania Le Jayenge view.",
      hiddenAngle: "The rock pools at the north end at low tide are full of sea life. Completely missed by most tourists.",
      activities: "Rock climbing, Cliff jumping (locals only — know the tides), Nightlife at Curlies",
      verified: true,
    },
  ],

  hiddenGems: [
    {
      name: "Divar Island",
      area: "Tiswadi, Central Goa",
      howToGet: "Free government ferry from Naroa (15 min from Old Goa). Ferry runs every 30 min.",
      desc: "An island frozen in Portuguese time. Baroque churches, laterite mansions, paddy fields, zero tourist infrastructure. Rent a bicycle (₹80/hour) and get completely lost. The Piedade Hill Church views are breathtaking.",
      bestTime: "Morning. Leave by 9 AM from Panaji.",
    },
    {
      name: "Cabo de Rama Fort",
      area: "Canacona, South Goa",
      howToGet: "Requires scooter/car — 20km from Palolem.",
      desc: "Pre-Portuguese fort on a dramatic cliff above the Arabian Sea. Views stretch 180 degrees over uninhabited coastline. Most tourists in South Goa never visit. Utterly free. You will almost certainly be alone.",
      bestTime: "Late afternoon. The sunset from the ramparts is extraordinary.",
    },
    {
      name: "Fontainhas Latin Quarter",
      area: "Panaji city",
      howToGet: "Walk from Panaji's Municipal Garden — 10 minutes.",
      desc: "Goa's original soul — Portuguese-era houses in ochre, indigo and terracotta, tiled facades, bougainvillea over iron balconies. The best street photography in Goa. A living heritage that most beach tourists completely miss.",
      bestTime: "Early morning (7–9 AM) or just before sunset. Light is extraordinary.",
    },
    {
      name: "Chandor Village",
      area: "Quepem, South Goa",
      howToGet: "40 min by car from Margao.",
      desc: "Where Goa's old aristocracy lived. The Menezes Braganza House is a 400-year-old mansion still inhabited by the original family — they conduct private tours. The most remarkable interior in all of Goa.",
      bestTime: "Weekday mornings (Sat–Sun can be busy with domestic tourists).",
    },
    {
      name: "Spice Plantation — Sahakari",
      area: "Ponda, Central Goa",
      howToGet: "30 min from Panaji. Own transport essential.",
      desc: "Working spice farm with a genuinely educational 2-hour tour through 200+ spice plants. Elephants, a waterfall, and the best Goan thali lunch (₹550, unlimited) you will eat. Not touristy despite what the signage suggests.",
      bestTime: "10 AM tour. Arrive before the buses at 11 AM.",
    },
    {
      name: "Chapora Fort at Dawn",
      area: "Vagator, North Goa",
      howToGet: "5-min walk from Vagator. Scooter recommended.",
      desc: "Known to tourists for its sunset. Unknown: at 5:45 AM, before any other soul arrives, this fort gives you uninterrupted views of the Chapora river snaking to the sea. The light is pink and the silence is total.",
      bestTime: "One hour before sunrise. Bring a jacket.",
    },
  ],

  foodGuide: {
    mustEat: [
      { dish: "Fish Curry Rice", desc: "The Goan national dish. Rice, coconut-based fish curry, sometimes with a fried fish. Best at Ritz Classic (Panaji) or any Xitt Codi restaurant.", price: "₹120–₹180" },
      { dish: "Prawn Balchão", desc: "A fiery, vinegar-pickled prawn preparation. Portuguese-influenced. Genuinely addictive. Not for the spice-averse.", price: "₹280–₹450" },
      { dish: "Bebinca", desc: "Goa's signature layered dessert — 16 layers of coconut, egg and sugar, baked over hours. Found at every bakery. Best at Infantaria.", price: "₹80–₹150/slice" },
      { dish: "Sorpotel", desc: "A Goan pork offal curry. Sounds alarming. Tastes extraordinary. The sour-spicy balance is unlike anything else in Indian cuisine.", price: "₹250–₹380" },
      { dish: "Goan Sausages (Choriz)", desc: "Pork sausages marinated in vinegar, chilli and spices. Eaten with poi bread. Every Goan deli has them. Buy from Panaji's municipal market.", price: "₹80/100g" },
      { dish: "Feni", desc: "Goa's indigenous spirit — distilled from cashew apple or coconut. Cashew feni (April–June) is the premium. Coconut feni is year-round. Try it in a soda with kokum.", price: "₹80–₹200/glass" },
      { dish: "Sol Kadhi", desc: "A cooling digestive drink made from kokum and coconut milk. Pink, slightly sour, extraordinary. Every Goan restaurant has it. Never miss it.", price: "₹60–₹120" },
      { dish: "Xacuti", desc: "A complex spiced curry with a roasted coconut and poppy seed base. Works with chicken, lamb or prawn. One of Goa's most sophisticated dishes.", price: "₹280–₹450" },
    ],
    markets: [
      { name: "Mapusa Friday Market", desc: "The real Goa market. Locals shopping for produce, spices, cashews, feni. Far less touristy than Anjuna. The vegetable section at 7 AM is extraordinary.", timing: "Fridays, 7 AM – 2 PM" },
      { name: "Anjuna Flea Market", desc: "The famous one. 2,000+ stalls. Clothing, jewelry, handicrafts, food. Heavily touristic but genuinely fun. Bargain to 30% of opening price.", timing: "Wednesdays, 8 AM – 6 PM (November–April only)" },
      { name: "Saturday Night Market, Arpora", desc: "The best night market in India. Live music, global food stalls, artisan crafts, fire performers. Go after 8 PM when it gets electric.", timing: "Saturdays, 6 PM – 2 AM (November–April only)" },
      { name: "Panaji Municipal Market", desc: "The soul of Panaji. Fresh fish at dawn, local produce, Goan sausages, fresh toddy (if you know who to ask). The most authentic market experience in Goa.", timing: "Daily, 6 AM – 1 PM. Fish section best 6–8 AM" },
    ],
  },

  seasonal: [
    { month: "October–November", vibe: "Shoulder season — the sweet spot", crowd: "Low", weather: "Post-monsoon green. Sea slightly rough. Perfect temperature 26–32°C.", bestFor: "Waterfalls (Dudhsagar is flowing), Empty beaches, Best hotel rates (40% cheaper)." },
    { month: "December–January", vibe: "Peak season — buzzing and beautiful", crowd: "Very high", weather: "Perfect 24–28°C, zero rain, calm sea.", bestFor: "Everything. Christmas and NYE are extraordinary in Goa. Book 3 months ahead." },
    { month: "February–March",   vibe: "Peak tapering — still excellent", crowd: "High falling to moderate", weather: "Warmer 28–32°C. Still excellent.", bestFor: "Carnival (February) — Goa's biggest festival. Excellent value before April surge." },
    { month: "April–May",        vibe: "Hot and quiet", crowd: "Very low (post-season)", weather: "Hot 32–36°C. Cashew season — feni festivals. Sea calms down.", bestFor: "Cashew feni trail, Empty beaches, 50–60% hotel discounts." },
    { month: "June–September",   vibe: "Monsoon — Goa transformed", crowd: "Minimal (locals only)", weather: "Heavy rain, lush green, 26–30°C. Most beach shacks closed.", bestFor: "Waterfalls. Absolute solitude. Goa's natural landscape at its most dramatic. 70% hotel discounts. Locals say this is the real Goa." },
  ],

  budgets: {
    backpacker: {
      label: "₹1,500/day",
      accommodation: "₹500–₹800 (dorm or basic guesthouse)",
      food: "₹300–₹500 (local restaurants, beach shacks)",
      transport: "₹200–₹350 (scooter rental)",
      activities: "₹200–₹300 (beaches are free)",
      tips: ["Eat at Xitt Codi restaurants (local fish curry rice joints)", "Rent scooter not taxis", "Stay in Arambol or Palolem for cheapest dorms", "Free beaches — avoid paid water sports"],
    },
    comfortable: {
      label: "₹3,500–₹5,000/day",
      accommodation: "₹1,500–₹2,500 (boutique guesthouse)",
      food: "₹800–₹1,200 (mix of local and good restaurants)",
      transport: "₹400–₹600 (scooter + occasional taxi)",
      activities: "₹600–₹1,000 (1 paid activity/day)",
      tips: ["Gunpowder and Thalassa for special meals", "Royal Enfield rental for day trips", "Day trip to Dudhsagar and spice farm", "Evening at Saturday Night Market"],
    },
    luxury: {
      label: "₹10,000–₹25,000/day",
      accommodation: "₹5,000–₹15,000 (heritage villa or boutique hotel)",
      food: "₹2,000–₹4,000 (Antares, Black Sheep Bistro, private chef)",
      transport: "₹1,500–₹3,000 (private cab)",
      activities: "₹2,000–₹5,000 (private yacht, golf, Dudhsagar helicopter)",
      tips: ["Alila Diwa, Taj Exotica or Leela for accommodation", "Book private Butterfly Beach boat", "Sunset yacht charter from Panaji (₹8,000–₹15,000)", "Tasting menu at Black Sheep Bistro"],
    },
  },

  emergencies: [
    { service: "Police",              number: "100",           note: "Panaji HQ: 0832-2224870" },
    { service: "Tourist Police",      number: "1090",          note: "Specifically for tourist incidents" },
    { service: "Tourist Helpline",    number: "1800-209-7767", note: "Goa Tourism free helpline. 24/7." },
    { service: "Ambulance",           number: "108",           note: "Free government ambulance" },
    { service: "Fire",                number: "101",           note: "" },
    { service: "Goa Medical College", number: "0832-2458740",  note: "Main government hospital, Bambolim" },
  ],
};

/* ══════════════════════════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════════════════════════ */
const TABS = [
  { id: "chat",      label: "Ask GoaGuide",   icon: "💬" },
  { id: "eat",       label: "Where to Eat",   icon: "🍽️" },
  { id: "beaches",   label: "Beaches",        icon: "🌊" },
  { id: "gems",      label: "Hidden Goa",     icon: "🗺️" },
  { id: "prices",    label: "Fair Prices",    icon: "₹"  },
  { id: "food",      label: "Goa Food Guide", icon: "🥘" },
  { id: "season",    label: "When to Visit",  icon: "📅" },
];

const STARTERS = [
  "Give me a 3-day itinerary under ₹8,000 total",
  "Best hidden beaches that most tourists miss?",
  "Where do locals eat in Panaji?",
  "Is Goa worth visiting in monsoon?",
  "Best time to visit for fewer crowds?",
  "What should I absolutely eat in Goa?",
  "Tell me about a side of Goa most tourists never see",
];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function GoaGuide() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isTouristLoggedIn } = useTourist();

  const [tab,     setTab    ] = useState("chat");
  const [input,   setInput  ] = useState("");
  const [msgs,    setMsgs   ] = useState([{
    role: "assistant",
    content: "Namaskaar. 🌴\n\n I'm your Goa Friend — not a search engine, just someone who knows this place well. The quiet corners, the honest food, the little things worth slowing down for.\n\nWhat would you like to know?",
  }]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = useCallback(async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    if (!isTouristLoggedIn) {
      setShowLogin(true);
      return;
    }
    setInput("");
    setMsgs(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const history = [...msgs.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })), { role: "user", content: q }];
      const { reply, action, redirectUrl } = await sendChatMessage(history);
      setMsgs(prev => [...prev, {
        role: "assistant",
        content: reply,
        redirectUrl: action === "REDIRECT_ITINERARY" ? redirectUrl : undefined,
      }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  }, [input, msgs, loading, isTouristLoggedIn]);

  return (
    <div className="gg-root">
      <SEO
        path="/goaguide"
        title="Goa Guide — Ask Our AI Local"
        description="Ask TruGoa's AI guide anything about Goa — beaches, food, safety, itineraries — and get honest, locally-informed answers instantly."
      />

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          message="Sign in to ask GoaGuide"
        />
      )}

      {/* ── HERO ────────────────────────────────────────────
      <div className="gg-hero">
        <div className="gg-hero-bg" />
        <div className="gg-hero-overlay" />
        <div className="grain" />
        <div className="gg-hero-content"
          style={{ padding: isMobile ? "0 24px" : "0 clamp(40px,6vw,96px)" }}>
          <p className="gg-hero-eyebrow">
            <span className="gg-hero-dot" />
            Your Local Goa Expert
          </p>
          <h1 className="gg-hero-title"
            style={{ fontSize: isMobile ? "clamp(48px,13vw,72px)" : "clamp(72px,8vw,120px)" }}>
            GoaGuide
          </h1>
          <h1 className="gg-hero-title gg-hero-italic"
            style={{ fontSize: isMobile ? "clamp(48px,13vw,72px)" : "clamp(72px,8vw,120px)" }}>
            AI.
          </h1>
          <p className="gg-hero-sub">
            Trained on 500+ verified places, real taxi prices,<br />
            hidden beaches and the true, authentic side of Goa.
          </p>
        </div>
      </div> */}

      {/* ── TAB BAR ───────────────────────────────────────── */}
      <div className="gg-tabs no-scrollbar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`gg-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="gg-tab-icon">{t.icon}</span>
            {!isMobile && <span>{t.label}</span>}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: CHAT
      ══════════════════════════════════════════════════ */}
      {tab === "chat" && (
        <div className="gg-chat-wrap">

          {/* messages */}
          <div className="gg-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`gg-msg gg-msg-${m.role === "assistant" ? "ai" : "user"}`}>
                {m.role === "assistant" && (
                  <div className="gg-msg-avatar">🌴</div>
                )}
                <div className={`gg-bubble gg-bubble-${m.role === "assistant" ? "ai" : "user"}`}>
                  {m.content}
                  {m.redirectUrl && (
                    <button
                      className="gg-itinerary-cta"
                      onClick={() => navigate(m.redirectUrl)}
                    >
                      Open Itinerary Planner →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="gg-msg gg-msg-ai">
                <div className="gg-msg-avatar">🌴</div>
                <div className="gg-bubble gg-bubble-ai gg-typing">
                  {[0,1,2].map(i => <span key={i} className="gg-dot" style={{ animationDelay: `${i*0.15}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* starter questions */}
          <div className="gg-starters no-scrollbar">
            {STARTERS.map(q => (
              <button key={q} className="gg-starter" onClick={() => send(q)}>{q}</button>
            ))}
          </div>

          {/* input */}
          <div className="gg-input-bar">
            <input
              className="gg-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask anything about Goa…"
            />
            <button
              className={`gg-send ${input.trim() ? "ready" : ""}`}
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: EAT
      ══════════════════════════════════════════════════ */}
      {tab === "eat" && (
        <div className="gg-content"
          style={{ padding: isMobile ? "40px 20px" : "56px clamp(40px,6vw,96px)" }}>
          <div className="gg-section-head">
            <p className="gg-eyebrow">Restaurants & Cafés</p>
            <h2 className="gg-section-title"
              style={{ fontSize: isMobile ? 34 : "clamp(36px,4vw,56px)" }}>
              Where to eat in Goa
            </h2>
            <p className="gg-section-sub">Every restaurant below has been personally visited and verified.</p>
          </div>

          <h3 className="gg-sub-heading">Restaurants</h3>
          <div className="gg-cards">
            {GOA.restaurants.map((r, i) => (
              <div key={i} className="gg-place-card">
                <div className="gg-place-top">
                  <div>
                    <div className="gg-place-meta">{r.type} · {r.area}</div>
                    <h3 className="gg-place-name">{r.name}</h3>
                  </div>
                  <div className="gg-place-rating">⭐ {r.rating}</div>
                </div>
                <div className="gg-place-budget">{r.budget}</div>
                {r.hours && <div className="gg-place-hours">🕐 {r.hours}</div>}
                <div className="gg-place-tip">
                  <span className="gg-tip-icon">💡</span>
                  <span>{r.localTip}</span>
                </div>
                <div className="gg-place-must">
                  <span className="gg-must-label">Must order</span>
                  <span>{r.mustOrder}</span>
                </div>
                {r.avoid && (
                  <div className="gg-place-avoid">⚑ {r.avoid}</div>
                )}
              </div>
            ))}
          </div>

          <h3 className="gg-sub-heading" style={{ marginTop: 48 }}>Cafés</h3>
          <div className="gg-cards">
            {GOA.cafes.map((c, i) => (
              <div key={i} className="gg-place-card">
                <div className="gg-place-top">
                  <div>
                    <div className="gg-place-meta">{c.type} · {c.area}</div>
                    <h3 className="gg-place-name">{c.name}</h3>
                  </div>
                  <div className="gg-place-rating">⭐ {c.rating}</div>
                </div>
                <div className="gg-place-budget">{c.budget}</div>
                {c.hours && <div className="gg-place-hours">🕐 {c.hours}</div>}
                <div className="gg-place-tip">
                  <span className="gg-tip-icon">💡</span>
                  <span>{c.localTip}</span>
                </div>
                <div className="gg-place-must">
                  <span className="gg-must-label">Must order</span>
                  <span>{c.mustOrder}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: BEACHES
      ══════════════════════════════════════════════════ */}
      {tab === "beaches" && (
        <div className="gg-content"
          style={{ padding: isMobile ? "40px 20px" : "56px clamp(40px,6vw,96px)" }}>
          <div className="gg-section-head">
            <p className="gg-eyebrow">Beaches of Goa</p>
            <h2 className="gg-section-title"
              style={{ fontSize: isMobile ? 34 : "clamp(36px,4vw,56px)" }}>
              The honest beach guide
            </h2>
            <p className="gg-section-sub">Not every beach in Goa is created equal. Here's what we actually think.</p>
          </div>
          <div className="gg-cards">
            {GOA.beaches.map((b, i) => (
              <div key={i} className="gg-beach-card">
                <div className="gg-beach-header">
                  <div>
                    <div className="gg-place-meta">{b.area}</div>
                    <h3 className="gg-place-name">{b.name}</h3>
                    <div className="gg-beach-type">{b.type}</div>
                  </div>
                  <div className="gg-crowd-pill">{b.crowd.split("—")[0].trim()}</div>
                </div>
                <div className="gg-beach-best">📅 Best time: {b.bestTime}</div>
                <div className="gg-place-tip">
                  <span className="gg-tip-icon">💡</span>
                  <span>{b.localTip}</span>
                </div>
                {b.hiddenAngle && (
                  <div className="gg-hidden-angle">
                    <span className="gg-hidden-icon">🗺️</span>
                    <span>{b.hiddenAngle}</span>
                  </div>
                )}
                <div className="gg-activities">
                  <span className="gg-must-label">Activities</span>
                  <span>{b.activities}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: HIDDEN GEMS
      ══════════════════════════════════════════════════ */}
      {tab === "gems" && (
        <div className="gg-content gg-dark-content">
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "40px 20px" : "56px clamp(40px,6vw,96px)" }}>
            <div className="gg-section-head">
              <p className="gg-eyebrow-light">The Goa Most Tourists Miss</p>
              <h2 className="gg-section-title-light"
                style={{ fontSize: isMobile ? 34 : "clamp(36px,4vw,56px)" }}>
                Hidden Goa
              </h2>
              <p className="gg-section-sub-light">Six places that will make your Goa different from everyone else's.</p>
            </div>
            <div className="gg-gems-list">
              {GOA.hiddenGems.map((g, i) => (
                <div key={i} className="gg-gem-card">
                  <div className="gg-gem-num">
                    {String(i+1).padStart(2,"0")}
                  </div>
                  <div className="gg-gem-body">
                    <h3 className="gg-gem-name">{g.name}</h3>
                    <div className="gg-gem-area">📍 {g.area}</div>
                    <div className="gg-gem-how">🚗 {g.howToGet}</div>
                    <p className="gg-gem-desc">{g.desc}</p>
                    <div className="gg-gem-best">Best time: {g.bestTime}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: PRICES
      ══════════════════════════════════════════════════ */}
      {tab === "prices" && (
        <div className="gg-content"
          style={{ padding: isMobile ? "40px 20px" : "56px clamp(40px,6vw,96px)" }}>
          <div className="gg-section-head">
            <p className="gg-eyebrow">Fair Price Index</p>
            <h2 className="gg-section-title"
              style={{ fontSize: isMobile ? 34 : "clamp(36px,4vw,56px)" }}>
              What everything<br />should actually cost
            </h2>
          </div>

          <div className="gg-price-alert">
            <span className="gg-price-alert-icon">💡</span>
            <div>
              <div className="gg-price-alert-title">Use the pre-paid counter inside Goa Airport</div>
              <div className="gg-price-alert-sub">Fixed, fair rates — no negotiation needed.</div>
            </div>
          </div>

          <div className="gg-price-table">
            {GOA.taxi.map((r, i) => (
              <div key={i} className="gg-price-row">
                <div className="gg-price-route">
                  <div className="gg-price-from">{r.from}</div>
                  {r.to !== r.from && (
                    <>
                      <div className="gg-price-arrow">↓</div>
                      <div className="gg-price-to">{r.to}</div>
                    </>
                  )}
                  {r.time !== "—" && <div className="gg-price-time">🕐 {r.time}</div>}
                </div>
                <div className="gg-price-amount">{r.price}</div>
                {r.tip && <div className="gg-price-tip">{r.tip}</div>}
              </div>
            ))}
          </div>

          {/* Budget guides */}
          <h3 className="gg-sub-heading" style={{ marginTop: 48 }}>Daily Budget Guides</h3>
          <div className="gg-budget-grid"
            style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)" }}>
            {Object.entries(GOA.budgets).map(([key, b]) => (
              <div key={key} className={`gg-budget-card gg-budget-${key}`}>
                <div className="gg-budget-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                <div className="gg-budget-amount">{b.label}</div>
                <div className="gg-budget-rows">
                  <div className="gg-budget-row"><span>🏨 Stay</span><span>{b.accommodation}</span></div>
                  <div className="gg-budget-row"><span>🍽️ Food</span><span>{b.food}</span></div>
                  <div className="gg-budget-row"><span>🛵 Transport</span><span>{b.transport}</span></div>
                  <div className="gg-budget-row"><span>🎯 Activities</span><span>{b.activities}</span></div>
                </div>
                <div className="gg-budget-tips">
                  {b.tips.map((t,i) => <div key={i} className="gg-budget-tip">· {t}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: FOOD GUIDE
      ══════════════════════════════════════════════════ */}
      {tab === "food" && (
        <div className="gg-content"
          style={{ padding: isMobile ? "40px 20px" : "56px clamp(40px,6vw,96px)" }}>
          <div className="gg-section-head">
            <p className="gg-eyebrow">The Goa Table</p>
            <h2 className="gg-section-title"
              style={{ fontSize: isMobile ? 34 : "clamp(36px,4vw,56px)" }}>
              What you must eat in Goa
            </h2>
          </div>
          <div className="gg-must-eat-grid"
            style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)" }}>
            {GOA.foodGuide.mustEat.map((f, i) => (
              <div key={i} className="gg-food-card">
                <div className="gg-food-top">
                  <h3 className="gg-food-name">{f.dish}</h3>
                  <span className="gg-food-price">{f.price}</span>
                </div>
                <p className="gg-food-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="gg-sub-heading" style={{ marginTop: 48 }}>Markets</h3>
          <div className="gg-cards">
            {GOA.foodGuide.markets.map((m, i) => (
              <div key={i} className="gg-market-card">
                <div className="gg-market-top">
                  <h3 className="gg-market-name">{m.name}</h3>
                  <span className="gg-market-timing">{m.timing}</span>
                </div>
                <p className="gg-market-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: SEASON
      ══════════════════════════════════════════════════ */}
      {tab === "season" && (
        <div className="gg-content gg-dark-content">
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "40px 20px" : "56px clamp(40px,6vw,96px)" }}>
            <div className="gg-section-head">
              <p className="gg-eyebrow-light">Seasonal Guide</p>
              <h2 className="gg-section-title-light"
                style={{ fontSize: isMobile ? 34 : "clamp(36px,4vw,56px)" }}>
                When to visit Goa
              </h2>
            </div>
            <div className="gg-season-list">
              {GOA.seasonal.map((s, i) => (
                <div key={i} className="gg-season-card">
                  <div className="gg-season-rule" />
                  <div className="gg-season-month">{s.month}</div>
                  <div className="gg-season-vibe">{s.vibe}</div>
                  <div className="gg-season-crowd">
                    <span className="gg-season-label">Crowds</span>
                    <span>{s.crowd}</span>
                  </div>
                  <div className="gg-season-weather">
                    <span className="gg-season-label">Weather</span>
                    <span>{s.weather}</span>
                  </div>
                  <div className="gg-season-best">
                    <span className="gg-season-label">Best for</span>
                    <span>{s.bestFor}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency numbers */}
            <div className="gg-emergency">
              <h3 className="gg-sub-heading" style={{ color: "white" }}>Emergency Numbers</h3>
              <div className="gg-emergency-grid"
                style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)" }}>
                {GOA.emergencies.map((e, i) => (
                  <div key={i} className="gg-emergency-card">
                    <div className="gg-emergency-service">{e.service}</div>
                    <div className="gg-emergency-number">{e.number}</div>
                    {e.note && <div className="gg-emergency-note">{e.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}