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

  // $geoNear must be the first stage of the pipeline, and unlike $near it
  // hands back the computed distance — used to show "2.4 km away" on the card.
  const businesses = await Business.aggregate([
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

  if (businesses.length > 0) {
    return sendSuccess(res, { data: businesses });
  }

  // Nothing within the radius. Most of the catalogue currently has no
  // coordinates at all, and those documents can never match $geoNear — so
  // falling back to the region the caller is standing in keeps the deck
  // usable instead of showing an empty state for a place that does have
  // curated listings. Results carry no `distance`, which the client renders
  // by simply omitting the "x km away" line.
  const fallback = await Business.find({
    ...baseFilter,
    area: { $in: areasForLatitude(lat) },
  })
    // Same trimmed shape as the geo path, so the client sees one payload.
    // No `distance` here — these results aren't ranked by proximity, and the
    // card omits the "x km away" line when it's absent.
    .select({ ...DECK_FIELDS, gallery: { $slice: 1 } })
    .sort({ editorPick: -1, featured: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  sendSuccess(res, { data: fallback });
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
