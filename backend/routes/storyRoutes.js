import express from "express";
import { getStories, getStoryBySlug } from "../controllers/storyController.js";
import { storySlugParamRules } from "../validators/storyValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// GET /api/v1/stories — public, summary fields only
router.get("/", getStories);

// GET /api/v1/stories/:slug — public, full detail
router.get("/:slug", storySlugParamRules, validate, getStoryBySlug);

export default router;
