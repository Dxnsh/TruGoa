import express from "express";
import { createContactMessage } from "../controllers/contactController.js";
import { contactLimiter } from "../middleware/rateLimiter.js";
import { createContactMessageRules } from "../validators/contactValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// POST /api/v1/contact — public, rate limited
router.post("/", contactLimiter, createContactMessageRules, validate, createContactMessage);

export default router;
