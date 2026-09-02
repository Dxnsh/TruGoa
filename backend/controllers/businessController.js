import Business from "../models/Business.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isDevelopment } from "../config/env.js";

// Query values reach $regex as raw strings, so any metacharacter the caller
// sends is interpreted as pattern syntax: "search=.*" matches every document,
// "(?:" is an invalid pattern that Mongo rejects with a 500, and a nested
// quantifier like "(a+)+" is a ReDoS vector. Escaping makes the input literal.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// express-validator's .toBoolean()/.toInt() sanitisers don't stick on Express 5
// (req.query is a getter), so flags arrive as strings — and the string "false"
// is truthy. Compare explicitly instead of testing truthiness.
const isTrue = (value) => value === true || value === "true" || value === "1";

// The one public visibility rule, shared by every public read below: a
// business is public only once an admin has approved it. There is no owner
// onboarding — admins are the only people who create or publish listings —
// so "approved" is the whole of the rule.
//
// Local development deliberately serves the whole catalogue, so unapproved
// drafts can be worked on without publishing them first. Any environment
// that has not opted into development gets the approved-only filter.
const publicVisibility = () => (isDevelopment ? {} : { status: "approved" });

// Moderation bookkeeping that belongs to the admin dashboard and never to a
// public response. Excluded rather than whitelisted so newly added content
// fields keep reaching the site on their own.
const PUBLIC_EXCLUDED_FIELDS = "-rejectionReason -reviewedAt";

// What a listing card actually renders — the same idea as DECK_FIELDS below,
// sized for the Explore grid rather than the swipe deck.
//
// The list endpoint used to return whole documents. `story` alone is capped at
// 5000 characters and is read on nothing but a detail page; with highlights,
// mustTry, idealFor, the safety notes and the contact block it was the bulk of
// a response that grew linearly with the catalogue. An inclusion projection
// also means the moderation fields can never appear here by accident.
export const LIST_FIELDS = {
  slug: 1, name: 1, category: 1, subCategory: 1,
  tagline: 1, description: 1,
  location: 1, area: 1, latitude: 1, longitude: 1,
  priceRange: 1, priceLevel: 1,
  heroImage: 1, gallery: { $slice: 1 },
  verified: 1, featured: 1, editorPick: 1, tags: 1,
  rating: 1, reviewCount: 1, createdAt: 1,
};

// Page/limit read off a query string, clamped so no caller can ask for the
// whole collection in one request.
export const paginationFrom = (query, defaultLimit, maxLimit) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

// One envelope shape for every paginated list, so a caller can page through
// any of them without special-casing.
export const paginated = (items, total, page, limit) => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  hasMore: page * limit < total,
});

// GET /businesses — public, one page of approved businesses.
// Query: ?category=a,b &tag= &area= &priceLevel= &featured= &search= &page= &limit=
export const getBusinesses = asyncHandler(async (req, res) => {
  const { area, priceLevel, featured, search, tag } = req.query;

  const filter = { ...publicVisibility() };

  // area is stored lowercase by the schema, so an exact match is both correct
  // and index-friendly — a case-insensitive $regex couldn't use the
  // {area,status} index.
  if (area) filter.area = String(area).toLowerCase();
  if (priceLevel) filter.priceLevel = priceLevel;
  if (featured !== undefined) filter.featured = isTrue(featured);

  // Accepts a comma-separated list, the shape /nearby already takes, because
  // one filter in the UI spans several stored values — "stays" is hotel,
  // resort, homestay and stay. Explore used to pull the whole catalogue and
  // apply these predicates in the browser.
  const categories = String(req.query.category || "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  // A UI filter can also be a tag rather than a category ("hidden"), or both
  // at once ("food" is three categories or the food tag) — so these two are
  // OR-ed, matching what the client used to compute locally.
  const scope = [];
  if (categories.length) scope.push({ category: { $in: categories } });
  if (tag) scope.push({ tags: String(tag).trim() });

  const conditions = [];
  if (scope.length) conditions.push(scope.length === 1 ? scope[0] : { $or: scope });

  if (search) {
    const term = escapeRegex(search);
    conditions.push({
      $or: [
        { name: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { area: { $regex: term, $options: "i" } },
      ],
    });
  }

  // $and rather than merging into $or: scope and search are separate
  // restrictions, and a single $or key would let one overwrite the other.
  if (conditions.length) filter.$and = conditions;

  const { page, limit, skip } = paginationFrom(req.query, 24, 100);
  const sort = { editorPick: -1, featured: -1, createdAt: -1 };

  const [items, total] = await Promise.all([
    Business.find(filter).select(LIST_FIELDS).sort(sort).skip(skip).limit(limit).lean(),
    Business.countDocuments(filter),
  ]);

  sendSuccess(res, { data: paginated(items, total, page, limit) });
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
  // The deck follows a live position, and the distance $geoNear computes is
  // measured from wherever the query ran — so it's already stale by the time
  // someone has walked a street. These let the client recompute it against the
  // current fix on every update, and cost two numbers per card.
  latitude: 1, longitude: 1,
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
    ...publicVisibility(),
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
  const { slug } = req.params;

  const business = await Business.findOne({ slug, ...publicVisibility() })
    .select(PUBLIC_EXCLUDED_FIELDS);
  if (business) return sendSuccess(res, { data: business });

  // Not a current slug — it may be one this listing was renamed away from.
  // Renaming changes the public URL, so every link already out there points at
  // the old one; a 301 keeps those working and tells crawlers which URL now
  // holds the content, instead of turning them all into 404s.
  //
  // The visibility filter is applied to this lookup too. Without it an old
  // slug would redirect for a business that is not public, which is the same
  // disclosure the current-slug filter exists to prevent.
  const renamed = await Business.findOne({ previousSlugs: slug, ...publicVisibility() })
    .select("slug");

  if (renamed?.slug) {
    // req.baseUrl is the router mount point (/api/v1/businesses), so this stays
    // correct if the API is ever mounted elsewhere. fetch follows the redirect
    // on its own, so the client receives the JSON it asked for either way.
    return res.redirect(301, `${req.baseUrl}/slug/${encodeURIComponent(renamed.slug)}`);
  }

  throw new ApiError(404, "Business not found");
});

// GET /businesses/:id — public
export const getBusinessById = asyncHandler(async (req, res) => {
  // findOne carrying the visibility rule, not findById: a business that is
  // not public has to be indistinguishable from one that does not exist, or
  // the 404 itself confirms the record is there. This route is reachable in
  // production — DetailPage falls back to it for older /listings/<id> links
  // — so it needs the same gate the slug lookup already applies.
  const business = await Business.findOne({ _id: req.params.id, ...publicVisibility() })
    .select(PUBLIC_EXCLUDED_FIELDS);
  if (!business) throw new ApiError(404, "Business not found");

  sendSuccess(res, { data: business });
});
