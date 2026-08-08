import express from "express";
import { chat } from "../controllers/aiController.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { chatRules } from "../validators/aiValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post("/chat", aiLimiter, chatRules, validate, chat);

export default router;
