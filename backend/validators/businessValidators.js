import { query, param } from "express-validator";

export const listBusinessesRules = [
  // May be a comma-separated list, so it needs more room than a single value.
  query("category").optional().isString().trim().isLength({ max: 120 }),
  query("tag").optional().isString().trim().isLength({ max: 50 }),
  query("area").optional().isIn(["north-goa", "south-goa", "panaji", "central-goa"]),
  query("priceLevel").optional().isIn(["budget", "mid", "premium"]),
  query("featured").optional().isBoolean().toBoolean(),
  query("search").optional().isString().trim().isLength({ max: 100 }),
  // Filter to places open right now (default on, except alongside ?search=).
  query("openNow").optional().isBoolean(),
  // Order open places first without hiding the closed ones (for the homepage row).
  query("openFirst").optional().isBoolean(),
  // Bounds are enforced in the controller too; rejecting nonsense here keeps a
  // negative page or a non-numeric limit from reaching the query at all.
  query("page").optional().isInt({ min: 1, max: 10000 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

// Bounds are enforced here rather than in the controller so a malformed
// coordinate is rejected before it reaches Mongo — $near throws a raw driver
// error on out-of-range values, which would surface as a 500.
export const nearbyBusinessesRules = [
  query("lat")
    .exists().withMessage("lat is required")
    .isFloat({ min: -90, max: 90 }).withMessage("lat must be between -90 and 90")
    .toFloat(),
  query("lng")
    .exists().withMessage("lng is required")
    .isFloat({ min: -180, max: 180 }).withMessage("lng must be between -180 and 180")
    .toFloat(),
  // Capped at 200km so a huge value can't turn this into a full-collection scan.
  query("maxDistance")
    .optional()
    .isInt({ min: 100, max: 200000 }).withMessage("maxDistance must be 100–200000 metres")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 }).toInt(),
  // May be a comma-separated list, so it needs more room than a single value.
  query("category").optional().isString().trim().isLength({ max: 120 }),
  // Deck defaults to open-only; ?openNow=false includes closed places.
  query("openNow").optional().isBoolean(),
];

export const businessIdParamRules = [
  param("id").isMongoId().withMessage("Invalid business id"),
];

export const businessSlugParamRules = [
  param("slug").isString().trim().notEmpty(),
];
