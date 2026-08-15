import express from "express";
import {
  getBusinesses,
  getBusinessBySlug,
  getBusinessById,
  getNearbyBusinesses,
} from "../controllers/businessController.js";
import {
  listBusinessesRules,
  businessIdParamRules,
  businessSlugParamRules,
  nearbyBusinessesRules,
} from "../validators/businessValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

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

// Business creation is admin-curated only — see POST /api/v1/admin/businesses.

export default router;
