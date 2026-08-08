import express from "express";
import {
  getBusinesses,
  getBusinessBySlug,
  getBusinessById,
} from "../controllers/businessController.js";
import {
  listBusinessesRules,
  businessIdParamRules,
  businessSlugParamRules,
} from "../validators/businessValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// GET /api/v1/businesses
// Optional query params: ?category=restaurant&area=north-goa&priceLevel=budget&featured=true&search=britto
router.get("/", listBusinessesRules, validate, getBusinesses);

// GET /api/v1/businesses/slug/:slug — clean-URL lookup
router.get("/slug/:slug", businessSlugParamRules, validate, getBusinessBySlug);

// GET /api/v1/businesses/:id — MongoDB ID lookup
router.get("/:id", businessIdParamRules, validate, getBusinessById);

// Business creation is admin-curated only — see POST /api/v1/admin/businesses.

export default router;
