import express from "express";

import { generateItinerary, getMyItinerary, saveItinerary } from "../controllers/itineraryController.js";
import { itineraryLimiter } from "../middleware/rateLimiter.js";
import { protectTourist } from "../middleware/authMiddleware.js";
import { generateItineraryRules, saveItineraryRules } from "../validators/itineraryValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/generate",
  itineraryLimiter,
  generateItineraryRules,
  validate,
  generateItinerary
);

router.get("/mine", protectTourist, getMyItinerary);
router.post("/save", protectTourist, saveItineraryRules, validate, saveItinerary);

export default router;
