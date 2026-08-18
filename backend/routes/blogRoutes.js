import express from "express";
import { getBlogs, getBlogBySlug } from "../controllers/blogController.js";
import { blogSlugParamRules } from "../validators/blogValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// GET /api/v1/blogs — public, summary fields only
router.get("/", getBlogs);

// GET /api/v1/blogs/:slug — public, full detail
router.get("/:slug", blogSlugParamRules, validate, getBlogBySlug);

export default router;
