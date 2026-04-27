import express from "express";
import { chat } from "../controllers/aiController.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// POST /api/ai/chat
// Rate limited — 20 requests per hour per IP (Claude API costs money)
router.post("/chat", aiLimiter, chat);

export default router;