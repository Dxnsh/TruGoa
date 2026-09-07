/**
 * AI-powered itinerary generator (Groq/Llama), grounded in PLACE_POOL so the
 * model can only recommend real, curated places — never hallucinated ones.
 * Falls back to the deterministic local generator (buildMockItinerary) if the
 * AI call fails or returns malformed JSON, so the endpoint never hard-fails.
 */

import OpenAI from "openai";
import Itinerary from "../models/Itinerary.js";
import Business from "../models/Business.js";
import { getPlacePhoto } from "../utils/googlePlacesPhoto.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/* ─── cost tiers per budget (used for slot / day / total cost strings) ─── */
const COST_TIERS = {
  budget:  { slot: [150, 500],   day: [1200, 1800],  daily: 1500 },
  mid:     { slot: [400, 1200],  day: [2800, 3800],  daily: 3500 },
  premium: { slot: [900, 2500],  day: [6000, 8000],  daily: 7000 },
  luxury:  { slot: [2000, 6000], day: [13000, 17000], daily: 15000 },
};

const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;
const costRange = ([lo, hi]) => `${fmt(lo)}–${fmt(hi)}`;

/* ─── editorial copy per vibe ─── */
const VIBE_COPY = {
  beach: {
    title: (d) => `${d} Days of Slow Goan Sunsets`,
    tagline:
      "Salt air, warm sand underfoot, and nothing on the agenda but the tide, the light, and the next plate of fish curry.",
    overview:
      "This itinerary keeps you close to the water — long mornings on quiet stretches of sand, lazy shack lunches, and evenings built entirely around the sunset. Nothing here is rushed.",
    coverMood: "Golden. Unhurried. Salt-kissed.",
  },
  heritage: {
    title: (d) => `${d} Days Through Old Goa`,
    tagline:
      "Portuguese façades, church bells at dusk, spice-scented lanes, and the kind of history you can still taste in the food.",
    overview:
      "A slower, more curious trip built around Goa's Latin Quarter, its churches, and the old trade routes that shaped the state. Expect cobbled streets over crowded beaches.",
    coverMood: "Faded pastels. Bell towers. Slow footsteps.",
  },
  hidden: {
    title: (d) => `${d} Days Off Goa's Beaten Path`,
    tagline:
      "The beaches without beach beds, the cafés with no sign outside, and the Goa that only shows up if you're willing to get a little lost.",
    overview:
      "Built for travellers who've already done the postcard version. This route trades the main strips for backroads, unmarked viewpoints, and the kind of places locals actually go.",
    coverMood: "Quiet. Unmarked. Worth the detour.",
  },
  party: {
    title: (d) => `${d} Days of North Goa Nights`,
    tagline:
      "Sundowners that turn into sunrise, beach clubs with a pulse, and just enough daylight recovery time before it all starts again.",
    overview:
      "This one runs on North Goa's nightlife circuit — beach clubs, rooftop bars, and late-night flea markets — with just enough downtime built in to survive it.",
    coverMood: "Loud. Bright. Wide awake.",
  },
  romantic: {
    title: (d) => `${d} Days, Just the Two of You`,
    tagline:
      "Private dinners on the sand, boutique villas with plunge pools, and evenings that end with a sunset cruise instead of a crowd.",
    overview:
      "A quieter, more intimate route — boutique stays, candlelit dinners, and experiences built for two, away from the louder parts of the coast.",
    coverMood: "Warm light. Two chairs. No rush.",
  },
  adventure: {
    title: (d) => `${d} Days of Goa in Motion`,
    tagline:
      "Kayaks at dawn, waterfalls by afternoon, and paragliding over the cliffs before the day winds down with a well-earned beer.",
    overview:
      "Built for travellers who'd rather move than lounge — water sports, treks, and the more physical side of Goa most itineraries skip entirely.",
    coverMood: "Kinetic. Sun-worn. Slightly out of breath.",
  },
};

const STYLE_NOTES = {
  solo: "Solo travellers: scooter hire is the easiest way to move between spots — most guesthouses can arrange one with a local licence.",
  couple: "Couples: many beach shacks will set up a private table with advance notice — worth a call ahead for sunset slots.",
  friends: "Groups: pre-book larger shacks and villas at least a week out during peak season (Dec–Jan) — they fill up fast.",
  family: "Families: stick closer to Candolim/Colva-style beaches with calmer water and easy parking; avoid party-heavy areas after dark.",
};

/* ─── place pool: tagged by vibe + period so selection actually varies ─── */
const PLACE_POOL = [
  { name: "Thalassa", area: "Vagator, North Goa", type: "Restaurant", period: "Evening", vibe: ["romantic", "party"], desc: "Whitewashed and cliffside, Thalassa is where the sunset becomes the whole point of dinner — go for the Greek platter and stay for the live music that starts as the sky turns pink.", tip: "Book a cliff-edge table by 5pm on weekends or you'll be seated inside." },
  { name: "Curlies", area: "Anjuna, North Goa", type: "Bar", period: "Evening", vibe: ["party", "beach"], desc: "A beach shack institution on Anjuna — part sunset bar, part dance floor by 10pm, with a crowd that spans backpackers to old Goa regulars.", tip: "Weeknights are far mellower than the Wednesday flea market crush." },
  { name: "Brittos", area: "Baga, North Goa", type: "Restaurant", period: "Afternoon", vibe: ["beach", "party"], desc: "Right on Baga's sand, Brittos does a Goan seafood thali that's been a lunch staple for two decades — order the fish recheado and a chilled Kingfisher.", tip: "Ask for a table right at the sand's edge — it's rarely full before 1pm." },
  { name: "Café Bodega", area: "Fontainhas, Panaji", type: "Café", period: "Morning", vibe: ["heritage", "hidden"], desc: "Tucked into a Portuguese-era house in the Latin Quarter, this café does strong filter coffee and quiche in a courtyard shaded by an old mango tree.", tip: "Sit upstairs on the balcony — it overlooks the quietest lane in Fontainhas." },
  { name: "Reis Magos Fort", area: "Reis Magos, North Goa", type: "Heritage", period: "Morning", vibe: ["heritage"], desc: "A restored 16th-century fort across the river from Panaji, with sweeping views of the Mandovi and a small museum on Goa's colonial history.", tip: "Arrive by 8:30am — the light on the ramparts is best before the heat sets in." },
  { name: "Gunpowder", area: "Assagao, North Goa", type: "Restaurant", period: "Afternoon", vibe: ["hidden", "heritage", "romantic"], desc: "A converted village home doing some of the best South Indian-Goan fusion in the state — the appams and Chettinad chicken are worth the drive alone.", tip: "The garden seating out back is quieter and cooler than the main dining room." },
  { name: "Arambol Beach", area: "Arambol, North Goa", type: "Beach", period: "Morning", vibe: ["hidden", "beach", "adventure"], desc: "Less developed than Baga or Calangute, Arambol's cliffside paths lead to a sweetwater lake and drum circles that start most evenings just past sunset.", tip: "Walk north past the main beach for a much quieter stretch of sand." },
  { name: "Palolem Beach", area: "Palolem, South Goa", type: "Beach", period: "Morning", vibe: ["beach", "romantic", "hidden"], desc: "South Goa's postcard beach — a curved bay of calm water, kayak rentals, and huts that light up at night without the North's club-heavy crowd.", tip: "Kayak to Butterfly Beach early morning before the day-trip boats arrive." },
  { name: "Antares", area: "Vagator, North Goa", type: "Restaurant", period: "Evening", vibe: ["romantic", "party"], desc: "Sleek, cliffside, and built for a long dinner — the tasting menu pairs well with the view, and the DJ set that follows keeps the evening going.", tip: "Sunset reservations book out days ahead in peak season — call directly." },
  { name: "Chapora Fort", area: "Chapora, North Goa", type: "Heritage", period: "Afternoon", vibe: ["heritage", "hidden"], desc: "A crumbling laterite fort above the Chapora River, famous from Dil Chahta Hai and still one of the best free sunset viewpoints on this coast.", tip: "Go an hour before sunset to beat the crowd and claim a spot on the north wall." },
  { name: "Anjuna Flea Market", area: "Anjuna, North Goa", type: "Market", period: "Afternoon", vibe: ["party", "hidden"], desc: "Goa's original flea market — stalls stacked with textiles, silver, and spices, running every Wednesday in season with a genuinely local energy in the mornings.", tip: "Go before 11am for real bargaining power, before the tour buses arrive." },
  { name: "Mandovi River Cruise", area: "Panaji, North Goa", type: "Activity", period: "Evening", vibe: ["romantic", "heritage"], desc: "A slow sunset cruise along the Mandovi with live Goan folk music — touristy by reputation, genuinely lovely by sunset.", tip: "Sit on the upper deck's right side for the best light as the sun drops." },
  { name: "Cola Beach", area: "Canacona, South Goa", type: "Beach", period: "Morning", vibe: ["hidden", "romantic"], desc: "A private lagoon beach reached by a short trek down a red-earth trail — one of the few spots on this coast that still feels undiscovered.", tip: "There's no shack here — bring water and cash for the one chai stall." },
  { name: "Dudhsagar Falls", area: "Mollem, South Goa", type: "Activity", period: "Morning", vibe: ["adventure"], desc: "A four-tiered waterfall inside Mollem National Park, reached by jeep safari through dense forest — the spray hits you well before the falls come into view.", tip: "Book the first jeep slot (7am) to avoid both crowds and the midday heat." },
  { name: "Grande Island Scuba", area: "off Vasco da Gama", type: "Activity", period: "Morning", vibe: ["adventure"], desc: "A boat ride out to Grande Island for a beginner-friendly scuba session over one of Goa's better reef patches — visibility is best November through February.", tip: "Book the earliest departure slot for calmer water and better visibility." },
  { name: "Divar Island", area: "Divar, North Goa", type: "Heritage", period: "Afternoon", vibe: ["hidden", "heritage"], desc: "A five-minute ferry ride from Old Goa drops you into a village that feels decades removed — paddy fields, a 16th-century church, and almost no other tourists.", tip: "The ferry is free and runs every 15 minutes — bring a bicycle if you can." },
  { name: "Colva Beach", area: "Colva, South Goa", type: "Beach", period: "Afternoon", vibe: ["beach", "romantic"], desc: "A wide, calm stretch of South Goa coastline with gentle water and a long promenade — the easiest beach in the state for an unhurried afternoon.", tip: "The shacks at the southern end are quieter and better value than the main strip." },
  { name: "Sunburn Festival Grounds Area", area: "Vagator, North Goa", type: "Bar", period: "Evening", vibe: ["party"], desc: "Even outside festival dates, this stretch of Vagator has the highest concentration of late-night beach clubs in the state, each with its own resident DJ lineup.", tip: "Cover charges drop significantly after 1am on weeknights." },
  { name: "Ritz Classic", area: "Panaji", type: "Restaurant", period: "Afternoon", vibe: ["heritage", "hidden"], desc: "An unassuming lunch spot near the Panaji market that locals swear by for Goan thalis — the fish curry rice sells out most days by 2pm.", tip: "Go before 1pm on weekdays — the queue starts early and moves fast." },
  { name: "Fontainhas Walking Trail", area: "Fontainhas, Panaji", type: "Heritage", period: "Morning", vibe: ["heritage"], desc: "A self-guided wander through Panaji's Latin Quarter — ochre and blue houses, wrought-iron balconies, and a genuinely different architectural register from the rest of Goa.", tip: "Early morning light (before 9am) makes the pastel facades look their best in photos." },
];

// Approximate coordinates for every curated place above, so the itinerary map
// can plot a pin for each stop even when the place isn't (yet) a Business
// listing with its own geo. A real listing match in enrichSlots() overrides
// these with the listing's own latitude/longitude.
const POOL_COORDS = {
  "Thalassa":                      { lat: 15.5990, lng: 73.7386 },
  "Curlies":                       { lat: 15.5657, lng: 73.7407 },
  "Brittos":                       { lat: 15.5560, lng: 73.7517 },
  "Café Bodega":                   { lat: 15.4909, lng: 73.8278 },
  "Reis Magos Fort":               { lat: 15.5010, lng: 73.8060 },
  "Gunpowder":                     { lat: 15.5940, lng: 73.7530 },
  "Arambol Beach":                 { lat: 15.6866, lng: 73.7043 },
  "Palolem Beach":                 { lat: 15.0100, lng: 74.0233 },
  "Antares":                       { lat: 15.5920, lng: 73.7360 },
  "Chapora Fort":                  { lat: 15.6055, lng: 73.7370 },
  "Anjuna Flea Market":            { lat: 15.5745, lng: 73.7440 },
  "Mandovi River Cruise":          { lat: 15.4980, lng: 73.8280 },
  "Cola Beach":                    { lat: 15.0630, lng: 74.0450 },
  "Dudhsagar Falls":               { lat: 15.3144, lng: 74.3144 },
  "Grande Island Scuba":           { lat: 15.3600, lng: 73.7600 },
  "Divar Island":                  { lat: 15.5170, lng: 73.9200 },
  "Colva Beach":                   { lat: 15.2790, lng: 73.9220 },
  "Sunburn Festival Grounds Area": { lat: 15.5930, lng: 73.7360 },
  "Ritz Classic":                  { lat: 15.4980, lng: 73.8290 },
  "Fontainhas Walking Trail":      { lat: 15.4989, lng: 73.8324 },
};

const PERIOD_ORDER = ["Morning", "Afternoon", "Evening"];

// How a real listing's category maps into the shape the generators expect —
// the card `type` label, a sensible default time-of-day, and which vibes the
// place suits. Anything not listed (hotel/stay) is not an itinerary stop.
const CATEGORY_MAP = {
  restaurant:    { type: "Restaurant",   period: "Afternoon", vibe: ["beach", "romantic", "heritage", "party"] },
  cafe:          { type: "Café",         period: "Morning",   vibe: ["hidden", "heritage", "romantic"] },
  beach:         { type: "Beach",        period: "Morning",   vibe: ["beach", "romantic", "hidden", "adventure"] },
  nightlife:     { type: "Bar",          period: "Evening",   vibe: ["party", "beach"] },
  market:        { type: "Market",       period: "Afternoon", vibe: ["party", "hidden", "heritage"] },
  heritage:      { type: "Heritage",     period: "Morning",   vibe: ["heritage", "hidden"] },
  spiritual:     { type: "Spiritual",    period: "Morning",   vibe: ["heritage", "hidden"] },
  museum:        { type: "Museum",       period: "Afternoon", vibe: ["heritage", "hidden"] },
  "art-gallery": { type: "Gallery",      period: "Afternoon", vibe: ["heritage", "hidden", "romantic"] },
  library:      { type: "Library",      period: "Afternoon", vibe: ["heritage", "hidden"] },
  activity:      { type: "Activity",     period: "Morning",   vibe: ["adventure", "hidden", "beach"] },
};

// Build the place pool from the live catalogue so the generator picks real
// listings — every one then carries its own photo, slug and coordinates
// straight through to the result page. Falls back to nothing (the caller
// tops up with the hardcoded PLACE_POOL) when the catalogue is thin.
async function buildCatalogPool() {
  try {
    const listings = await Business.find({
      status: "approved",
      category: { $in: Object.keys(CATEGORY_MAP) },
    })
      .select("name slug category location area latitude longitude description tagline localTip safetyTip bestTime heroImage gallery")
      .lean();

    return listings
      .map((b) => {
        const map = CATEGORY_MAP[b.category];
        if (!map) return null;
        const image = b.heroImage || b.gallery?.[0] || null;
        return {
          name: b.name,
          area: b.location || b.area || "Goa",
          type: map.type,
          period: map.period,
          vibe: map.vibe,
          desc: (b.description || b.tagline || "").slice(0, 600),
          tip: b.localTip || b.safetyTip || b.bestTime || "",
          image: image || undefined,
          slug: b.slug || undefined,
          lat: typeof b.latitude === "number" ? b.latitude : undefined,
          lng: typeof b.longitude === "number" ? b.longitude : undefined,
        };
      })
      .filter(Boolean);
  } catch (err) {
    logger.warn(`Itinerary catalogue pool unavailable, using curated fallback only: ${err.message}`);
    return [];
  }
}

// Below this many usable catalogue listings there isn't enough to build an
// itinerary from real places alone, so the curated hardcoded list is mixed in
// as a backstop (a fresh install with almost nothing added still gets a plan).
// At or above it, the itinerary is built ONLY from the operator's own approved
// listings — every stop is then a place they can actually see and manage, and
// the generator simply revisits places across days when the pool is short,
// rather than pulling in anything that isn't in the catalogue.
const CATALOG_MIN = 4;

function choosePool(catalogPool) {
  const photographed = catalogPool.filter((p) => p.image);

  // Enough listings that DO have a photo — use only those, so every stop the
  // generator picks carries its own distinct image (no two cards share a
  // generic category picture).
  if (photographed.length >= CATALOG_MIN) return photographed;

  if (catalogPool.length >= CATALOG_MIN) {
    // Some real listings but not enough photographed ones — use the whole
    // catalogue, photographed first.
    return [...photographed, ...catalogPool.filter((p) => !p.image)];
  }
  // Too thin — fall back: catalogue in front, curated list (with coords) behind.
  const seen = new Set(catalogPool.map((p) => p.name.toLowerCase()));
  const fallback = PLACE_POOL
    .filter((p) => !seen.has(p.name.toLowerCase()))
    .map((p) => {
      const coords = POOL_COORDS[p.name];
      return coords ? { ...p, lat: coords.lat, lng: coords.lng } : p;
    });
  return [...catalogPool, ...fallback];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInRange([lo, hi]) {
  return Math.round((lo + Math.random() * (hi - lo)) / 50) * 50;
}

function pickSlotsForDay(pool, usedIndexes, slotCount, costTier) {
  // prefer periods spread across Morning/Afternoon/Evening
  const periods = PERIOD_ORDER.slice(0, slotCount);
  const slots = [];

  for (const period of periods) {
    let candidates = pool.filter(
      (p, idx) => p.period === period && !usedIndexes.has(idx)
    );
    if (candidates.length === 0) {
      candidates = pool.filter((p, idx) => !usedIndexes.has(idx));
    }
    if (candidates.length === 0) {
      // pool exhausted — allow reuse
      candidates = pool.filter((p) => p.period === period);
      if (candidates.length === 0) candidates = pool;
    }

    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    const realIdx = pool.indexOf(choice);
    if (realIdx !== -1) usedIndexes.add(realIdx);

    const lo = randInRange(costTier.slot);
    const hi = lo + randInRange([100, Math.max(200, costTier.slot[1] - costTier.slot[0])]);

    slots.push({
      time:
        period === "Morning" ? "9:00 AM" : period === "Afternoon" ? "1:30 PM" : "6:30 PM",
      period,
      place: choice.name,
      area: choice.area,
      type: choice.type,
      description: choice.desc,
      insiderTip: choice.tip,
      estimatedCost: `${fmt(lo)}–${fmt(hi)} per person`,
    });
  }

  return slots;
}

function buildMockItinerary({ duration, budget, vibe, style }, pool = PLACE_POOL) {
  const days = Number(duration);
  const costTier = COST_TIERS[budget];
  const copy = VIBE_COPY[vibe];

  // pool favouring the chosen vibe, falling back to the full pool if too small
  let scopedPool = pool.filter((p) => p.vibe?.includes(vibe));
  if (scopedPool.length < days * 3) {
    scopedPool = [...scopedPool, ...pool.filter((p) => !scopedPool.includes(p))];
  }
  scopedPool = shuffle(scopedPool);

  const usedIndexes = new Set();
  let totalLo = 0;
  let totalHi = 0;

  const dayObjects = Array.from({ length: days }, (_, i) => {
    const slotCount = days <= 3 ? 4 : Math.random() > 0.5 ? 4 : 3;
    const slots = pickSlotsForDay(scopedPool, usedIndexes, slotCount, costTier);

    const dayLo = randInRange(costTier.day);
    const dayHi = dayLo + randInRange([300, 800]);
    totalLo += dayLo;
    totalHi += dayHi;

    return {
      day: i + 1,
      title:
        i === 0
          ? "Arrive Slow"
          : i === days - 1
          ? "One Last Sunset"
          : `Deeper Into Goa`,
      theme:
        i === 0
          ? "Let Goa find you — no fixed plans for the first few hours."
          : i === days - 1
          ? "Wind down the way the trip started: slowly."
          : "The pace picks up, the coastline changes character.",
      dayCost: costRange([dayLo, dayHi]),
      slots,
    };
  });

  return {
    title: copy.title(days),
    tagline: copy.tagline,
    overview: copy.overview,
    coverMood: copy.coverMood,
    totalBudget: costRange([totalLo, totalHi]),
    bestSeason: "October–March",
    practicalNotes: STYLE_NOTES[style],
    days: dayObjects,
  };
}

const ITINERARY_SYSTEM_PROMPT = `You are GoaGuide AI, the editorial itinerary planner for TruGoa — a premium, curated travel guide to Goa. You write like a Condé Nast Traveller editor: specific, honest, no filler.

CRITICAL RULE: You may ONLY recommend places from the CURATED_PLACES list provided in the user message. Never invent a restaurant, beach, fort, or activity that isn't in that list. If the list doesn't have enough places for a good day, it's fine to reuse a place across two days at different times, but do not fabricate new ones.

Return STRICT JSON only, matching exactly this shape (no markdown, no commentary):
{
  "title": "string — evocative editorial title for the trip",
  "tagline": "string — one sentence, sets the mood",
  "overview": "string — 2-3 sentences describing the trip's overall arc",
  "coverMood": "string — 3-5 word mood descriptor",
  "totalBudget": "string — e.g. ₹8,000–₹12,000",
  "bestSeason": "string — e.g. October–March",
  "practicalNotes": "string — one practical tip for this traveller style",
  "days": [
    {
      "day": 1,
      "title": "string — short day title",
      "theme": "string — one sentence describing the day's pace/focus",
      "dayCost": "string — e.g. ₹2,500–₹3,500",
      "slots": [
        {
          "time": "string — e.g. 9:00 AM",
          "period": "Morning" | "Afternoon" | "Evening",
          "place": "string — must match a name from CURATED_PLACES",
          "area": "string — from CURATED_PLACES",
          "type": "string — from CURATED_PLACES",
          "description": "string — editorial description, may draw on the CURATED_PLACES description",
          "insiderTip": "string — from CURATED_PLACES or refined",
          "estimatedCost": "string — e.g. ₹800–₹1,500 per person"
        }
      ]
    }
  ]
}`;

async function generateWithAI({ duration, budget, vibe, interests, style }, pool = PLACE_POOL) {
  const days = Number(duration);
  const slotsPerDay = days <= 3 ? 4 : 3;

  // Only the fields the model needs to choose and describe a place — image,
  // slug and coordinates are attached afterwards from the same pool by name.
  const promptPool = pool.map((p) => ({
    name: p.name, area: p.area, type: p.type, period: p.period,
    vibe: p.vibe, desc: p.desc, tip: p.tip,
  }));

  const userPrompt = `Build a ${days}-day Goa itinerary.
Budget tier: ${budget}
Primary vibe: ${vibe}
Interests: ${interests.join(", ")}
Traveller style: ${style}
Slots per day: ${slotsPerDay} (Morning/Afternoon/Evening)

CURATED_PLACES (JSON — the only places you may use):
${JSON.stringify(promptPool)}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    max_tokens: 3000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ITINERARY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices[0].message.content;
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.days) || parsed.days.length === 0) {
    throw new Error("AI response missing required 'days' array");
  }

  return parsed;
}

// Escapes a place name before it goes into a $regex, so a name with regex
// metacharacters ("Café Bodega", "Brittos") matches literally.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The generator (especially the AI) rarely echoes a listing's name verbatim —
// it drops apostrophes ("Britto's" → "Brittos"), adds the area
// ("Thalassa, Vagator"), prefixes "The", or changes case/accents. Normalising
// both sides to a bare alphanumeric key, and also trying just the part before
// the first comma, makes the match land far more often — which is the
// difference between a card showing that place's real photo and falling back
// to a shared category image.
const nameKey = (value) =>
  String(value || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")   // strip accents
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, "");

const nameVariants = (value) => {
  const full = String(value || "");
  const head = full.split(",")[0];
  return [...new Set([nameKey(full), nameKey(head)].filter(Boolean))];
};

/**
 * Attaches a photo, slug and coordinates to every slot by matching its `place`
 * name (case-insensitive) back to the pool the generator chose from — which is
 * catalogue-first, so most slots resolve to a real listing and carry that
 * listing's own cover photo. Any slot still missing an image or coordinates
 * after that is topped up: coordinates from the hardcoded pool table, and a
 * one-shot DB lookup for a photo in case the generator named a listing the
 * pool build missed. Best-effort — a failure here just means fewer photos.
 */
async function enrichSlots(itinerary, pool = []) {
  const poolByName = new Map();
  for (const p of pool) {
    for (const k of nameVariants(p.name)) if (!poolByName.has(k)) poolByName.set(k, p);
  }

  const slots = (itinerary.days || []).flatMap((d) => d.slots || []);
  const lookup = (map, place) => {
    for (const k of nameVariants(place)) {
      const hit = map.get(k);
      if (hit) return hit;
    }
    return undefined;
  };

  // 1. Fill from the pool entry the generator picked.
  for (const slot of slots) {
    const entry = lookup(poolByName, slot.place);
    if (entry) {
      if (!slot.image && entry.image) slot.image = entry.image;
      if (!slot.slug && entry.slug) slot.slug = entry.slug;
      if (typeof slot.latitude !== "number" && typeof entry.lat === "number") {
        slot.latitude = entry.lat;
        slot.longitude = entry.lng;
      }
    }
    // Hardcoded-pool coordinate table as a last resort for the map.
    const coords = POOL_COORDS[(slot.place || "").trim()];
    if (coords && typeof slot.latitude !== "number") {
      slot.latitude = coords.lat;
      slot.longitude = coords.lng;
    }
  }

  // 2. For anything still without a photo, one DB lookup — matching the full
  //    name or just the part before a comma, either as a prefix.
  try {
    const need = [
      ...new Set(
        slots
          .filter((s) => !s.image)
          .flatMap((s) => [(s.place || "").trim(), (s.place || "").split(",")[0].trim()])
          .filter((n) => n.length >= 3)
      ),
    ];
    if (need.length === 0) return itinerary;

    const listings = await Business.find({
      status: "approved",
      $or: need.map((n) => ({ name: new RegExp(`^${escapeRegex(n)}`, "i") })),
    })
      .select("name slug heroImage gallery latitude longitude")
      .lean();

    const byName = new Map();
    for (const b of listings) {
      for (const k of nameVariants(b.name)) if (!byName.has(k)) byName.set(k, b);
    }
    for (const slot of slots) {
      if (slot.image) continue;
      const match = lookup(byName, slot.place);
      if (!match) continue;
      slot.image = match.heroImage || match.gallery?.[0] || undefined;
      slot.slug = slot.slug || match.slug || undefined;
      if (typeof slot.latitude !== "number" && typeof match.latitude === "number") {
        slot.latitude = match.latitude;
        slot.longitude = match.longitude;
      }
    }
  } catch (err) {
    logger.warn(`Itinerary listing enrichment skipped: ${err.message}`);
  }

  // 3. Still no photo (no matching listing) — pull one straight from Google
  //    Places for the real place. No-op unless GOOGLE_PLACES_API_KEY is set;
  //    results are cached in the util, so repeated places cost nothing.
  if (process.env.GOOGLE_PLACES_API_KEY) {
    const pending = slots.filter((s) => !s.image && (s.place || "").trim());
    await Promise.all(
      pending.map(async (slot) => {
        const query = [slot.place, slot.area].filter(Boolean).join(", ") || slot.place;
        const bias =
          typeof slot.latitude === "number"
            ? { lat: slot.latitude, lng: slot.longitude }
            : undefined;
        const url = await getPlacePhoto(query, bias);
        if (url) slot.image = url;
      })
    );
  }

  return itinerary;
}

export const generateItinerary = asyncHandler(async (req, res) => {
  const { duration, budget, vibe, interests, style } = req.body;
  const params = { duration, budget, vibe, interests, style };

  // Built only from the operator's own approved listings once there are enough
  // of them (see choosePool / CATALOG_MIN); the curated hardcoded list is a
  // backstop for a near-empty catalogue only.
  const catalogPool = await buildCatalogPool();
  const pool = choosePool(catalogPool);
  logger.info(
    `Itinerary pool: ${pool.length} places (${catalogPool.length} in catalogue, ` +
    `${catalogPool.filter((p) => p.image).length} with photos, ` +
    `${pool.filter((p) => p.image).length} usable with photos)`
  );

  let itinerary;
  try {
    itinerary = await generateWithAI(params, pool);
  } catch (err) {
    logger.warn(`Itinerary AI generation failed, falling back to local generator: ${err.message}`);
    itinerary = buildMockItinerary(params, pool);
  }

  await enrichSlots(itinerary, pool);

  const total = (itinerary.days || []).flatMap((d) => d.slots || []).length;
  const withPhoto = (itinerary.days || [])
    .flatMap((d) => d.slots || [])
    .filter((s) => s.image).length;
  logger.info(`Itinerary generated: ${withPhoto}/${total} stops resolved to a listing photo`);

  return sendSuccess(res, { data: itinerary });
});

// GET /api/v1/itinerary/mine — the signed-in tourist's last saved itinerary
export const getMyItinerary = asyncHandler(async (req, res) => {
  const saved = await Itinerary.findOne({ tourist: req.user._id });
  if (!saved) throw new ApiError(404, "No saved itinerary");

  sendSuccess(res, { data: { form: saved.form, data: saved.data, updatedAt: saved.updatedAt } });
});

// POST /api/v1/itinerary/save — replaces the tourist's saved itinerary with the latest one
export const saveItinerary = asyncHandler(async (req, res) => {
  const { form, data } = req.body;

  // runValidators makes the sub-schema in models/Itinerary.js actually apply
  // on an upsert — without it Mongoose skips validation for update paths and
  // the document goes in unchecked, which is how arbitrary blobs were being
  // stored. setDefaultsOnInsert fills schema defaults on the insert half of
  // the upsert rather than leaving them unset on first save.
  const saved = await Itinerary.findOneAndUpdate(
    { tourist: req.user._id },
    { form, data },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  sendSuccess(res, { data: { updatedAt: saved.updatedAt } });
});