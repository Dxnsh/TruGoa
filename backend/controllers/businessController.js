import Business from "../models/Business.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Query values reach $regex as raw strings, so any metacharacter the caller
// sends is interpreted as pattern syntax: "search=.*" matches every document,
// "(?:" is an invalid pattern that Mongo rejects with a 500, and a nested
// quantifier like "(a+)+" is a ReDoS vector. Escaping makes the input literal.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// express-validator's .toBoolean()/.toInt() sanitisers don't stick on Express 5
// (req.query is a getter), so flags arrive as strings — and the string "false"
// is truthy. Compare explicitly instead of testing truthiness.
const isTrue = (value) => value === true || value === "true" || value === "1";

// GET /businesses — public, returns approved businesses (all statuses shown in dev)
export const getBusinesses = asyncHandler(async (req, res) => {
  const { category, area, priceLevel, featured, search } = req.query;

  const filter = {};

  if (process.env.NODE_ENV !== "development") {
    filter.status = "approved";
  }

  // category/area are stored lowercase by the schema, so an exact match is
  // both correct and index-friendly — a case-insensitive $regex couldn't use
  // the {category,status} / {area,status} indexes.
  if (category) filter.category = String(category).toLowerCase();
  if (area) filter.area = String(area).toLowerCase();
  if (priceLevel) filter.priceLevel = priceLevel;
  if (featured !== undefined) filter.featured = isTrue(featured);

  if (search) {
    const term = escapeRegex(search);
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { location: { $regex: term, $options: "i" } },
      { category: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
      { area: { $regex: term, $options: "i" } },
    ];
  }

  const businesses = await Business.find(filter).sort({
    editorPick: -1,
    featured: -1,
    createdAt: -1,
  });

  sendSuccess(res, { data: businesses });
});

// Goa splits either side of the Zuari, at roughly 15.42°N. Used only to pick
// sensible regions when a place has no coordinates of its own; it's a coarse
// bucket, not a real distance.
//
// All four schema areas have to appear in at least one bucket — returning a
// bare "north-goa"/"south-goa" would make anything tagged panaji or
// central-goa unreachable through this fallback entirely. Central Goa is
// within reach of both coasts, so it belongs to each; Panaji sits firmly
// north.
const areasForLatitude = (lat) =>
  lat >= 15.42
    ? ["north-goa", "panaji", "central-goa"]
    : ["south-goa", "central-goa"];

// Goa's rough bounding box. areasForLatitude is a bare latitude comparison, so
// on its own it happily buckets Pune, London or anywhere else north of 15.42°N
// into "north-goa" and calls the result nearby. Checking the box first lets a
// caller who simply isn't in Goa skip the regional guess and get the whole
// catalogue instead, labelled as such.
const GOA_BOUNDS = { minLat: 14.85, maxLat: 15.85, minLng: 73.6, maxLng: 74.35 };

const isInGoa = (lat, lng) =>
  lat >= GOA_BOUNDS.minLat && lat <= GOA_BOUNDS.maxLat &&
  lng >= GOA_BOUNDS.minLng && lng <= GOA_BOUNDS.maxLng;

// Exactly the fields the Discover swipe deck renders — card face, detail
// panel and the link out to the full listing. `distance` and `gallery` are
// added per query below, since $slice takes different arguments in an
// aggregation stage than in a find() projection.
const DECK_FIELDS = {
  slug: 1, name: 1, category: 1, verified: 1,
  heroImage: 1, location: 1, rating: 1,
  tagline: 1, description: 1, localTip: 1, bestTime: 1,
  mustTry: 1, priceRange: 1, openingHours: 1, scamAlert: 1,
};

// GET /businesses/nearby?lat=&lng=&maxDistance=&limit=&category=
// Curated places near a coordinate, nearest first — powers the Discover
// swipe deck on the homepage.
export const getNearbyBusinesses = asyncHandler(async (req, res) => {
  const { category } = req.query;

  // Coerce here rather than relying on express-validator's .toFloat()/.toInt():
  // Express 5 exposes req.query as a getter, so the validator's sanitised
  // values don't persist back onto it and these arrive as strings. String
  // coordinates make Mongo treat the point as a legacy pair instead of GeoJSON,
  // which fails with a misleading "Extra field found: $maxDistance" error.
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const maxDistance = Number(req.query.maxDistance) || 15000; // 15km default
  const limit = Number(req.query.limit) || 20;

  // Accepts one category or a comma-separated list, because a single mood in
  // the UI can span several enum values ("stays" is hotel + stay). A lone
  // value still works — it just becomes a one-element $in.
  const categories = String(category || "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const baseFilter = {
    ...(process.env.NODE_ENV !== "development" ? { status: "approved" } : {}),
    ...(categories.length ? { category: { $in: categories } } : {}),
  };

  // Same trimmed shape in every tier below, so the client sees one payload
  // regardless of how the results were found.
  const deckProjection = { ...DECK_FIELDS, gallery: { $slice: 1 } };
  const curatedFirst = { editorPick: -1, featured: -1, createdAt: -1 };

  // The deck narrows in three tiers, widening only when a tier comes back
  // empty, and `scope` tells the client which one answered so it can say so
  // instead of captioning region-wide results "near you". While the catalogue
  // is small — and while most documents still have no coordinates at all —
  // the last tier is what keeps the deck from being empty for everyone.
  //
  //   nearby → within maxDistance, ranked by distance
  //   region → the Goa region the caller is standing in
  //   goa    → the whole curated catalogue
  //
  // Callers outside Goa skip straight past the first two: a proximity search
  // run from another state can only ever return nothing, and the regional
  // guess would be a fiction.
  const inGoa = isInGoa(lat, lng);

  if (inGoa) {
    // $geoNear must be the first stage of the pipeline, and unlike $near it
    // hands back the computed distance — used to show "2.4 km away" on the card.
    const nearby = await Business.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance", // metres
          maxDistance,
          spherical: true,
          // Filtering inside $geoNear (rather than a later $match) lets the
          // index skip non-matching docs instead of over-fetching then discarding.
          query: baseFilter,
        },
      },
      { $limit: limit },
      // The swipe deck is the only consumer, and it renders maybe a third of a
      // business document. Shipping the rest (story, highlights, geo, contact,
      // timestamps) roughly tripled the response for no visible benefit, and
      // only gallery[0] is ever shown.
      { $project: { ...DECK_FIELDS, distance: 1, gallery: { $slice: ["$gallery", 1] } } },
    ]);

    if (nearby.length > 0) {
      return sendSuccess(res, { data: { scope: "nearby", places: nearby } });
    }

    // Nothing within the radius. Most of the catalogue currently has no
    // coordinates at all, and those documents can never match $geoNear — so
    // falling back to the region the caller is standing in keeps the deck
    // usable instead of showing an empty state for a coast that does have
    // curated listings. Results carry no `distance`, which the client renders
    // by simply omitting the "x km away" line.
    const regional = await Business.find({
      ...baseFilter,
      area: { $in: areasForLatitude(lat) },
    })
      .select(deckProjection)
      .sort(curatedFirst)
      .limit(limit)
      .lean();

    if (regional.length > 0) {
      return sendSuccess(res, { data: { scope: "region", places: regional } });
    }
  }

  // Last tier: everything curated, anywhere in Goa. Reached when the caller is
  // outside Goa, or when their own region has nothing in this category — with
  // categories as thin as one or two places each, a mood filter empties a
  // single region long before it empties the catalogue.
  const anywhere = await Business.find(baseFilter)
    .select(deckProjection)
    .sort(curatedFirst)
    .limit(limit)
    .lean();

  sendSuccess(res, { data: { scope: "goa", places: anywhere } });
});

// GET /businesses/slug/:slug — public
export const getBusinessBySlug = asyncHandler(async (req, res) => {
  const filter = { slug: req.params.slug };
  if (process.env.NODE_ENV !== "development") filter.status = "approved";

  const business = await Business.findOne(filter);
  if (!business) throw new ApiError(404, "Business not found");

  sendSuccess(res, { data: business });
});

// GET /businesses/:id — public
export const getBusinessById = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) throw new ApiError(404, "Business not found");

  sendSuccess(res, { data: business });
});
