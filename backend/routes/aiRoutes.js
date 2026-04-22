import express from "express";
import { chat } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", chat); // POST /api/ai/chat

export default router;