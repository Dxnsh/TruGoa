import express from "express";
import { getJournals, getJournalBySlug } from "../controllers/journalController.js";
import { journalSlugParamRules } from "../validators/journalValidators.js";
import { validate } from "../middleware/validate.js";
import { publicCache } from "../middleware/cacheControl.js";

const router = express.Router();

router.use(publicCache(120, 600));

// GET /api/v1/journals — public, published entries, summary fields only
router.get("/", getJournals);

// GET /api/v1/journals/:slug — public, published entry, full detail
router.get("/:slug", journalSlugParamRules, validate, getJournalBySlug);

export default router;
