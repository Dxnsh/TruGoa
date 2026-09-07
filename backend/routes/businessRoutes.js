import express from "express";
import {
  getBusinesses,
  getBusinessBySlug,
  getBusinessById,
  getNearbyBusinesses,
  getBusinessDrivingDistance,
} from "../controllers/businessController.js";
import {
  listBusinessesRules,
  businessIdParamRules,
  businessSlugParamRules,
  nearbyBusinessesRules,
  drivingDistanceRules,
} from "../validators/businessValidators.js";
import { validate } from "../middleware/validate.js";
import { drivingDistanceLimiter } from "../middleware/rateLimiter.js";
import { publicCache } from "../middleware/cacheControl.js";

const router = express.Router();

// Every read below is a public, non-personalised view of the catalogue — safe
// to cache briefly at the CDN/browser so repeat navigation doesn't re-hit the
// DB (and the rate limiter) for bytes that change a few times a day.
router.use(publicCache(60, 300));

// GET /api/v1/businesses
// Optional query params: ?category=restaurant&area=north-goa&priceLevel=budget&featured=true&search=britto
router.get("/", listBusinessesRules, validate, getBusinesses);

// GET /api/v1/businesses/nearby?lat=15.55&lng=73.75&maxDistance=15000
// Must stay above the "/:id" route below — Express matches in order, so
// registering it later would make "nearby" get parsed as a business id.
router.get("/nearby", nearbyBusinessesRules, validate, getNearbyBusinesses);

// GET /api/v1/businesses/slug/:slug — clean-URL lookup
router.get("/slug/:slug", businessSlugParamRules, validate, getBusinessBySlug);

// GET /api/v1/businesses/:id — MongoDB ID lookup
router.get("/:id", businessIdParamRules, validate, getBusinessById);

// GET /api/v1/businesses/:id/driving-distance?ulat=&ulng= — real driving
// distance/duration from the visitor to this business (OpenRouteService),
// with a graceful { available: false } instead of an error when it can't be
// produced. Called once per detail-page view, never per card/list.
router.get(
  "/:id/driving-distance",
  drivingDistanceLimiter,
  drivingDistanceRules,
  validate,
  getBusinessDrivingDistance
);

// Business creation is admin-curated only — see POST /api/v1/admin/businesses.

export default router;
