import express from "express";
import { addReview, getReviewsForBusiness } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", getReviewsForBusiness);   // GET /api/reviews?business_id=xxx
router.post("/", addReview);              // POST /api/reviews

export default router;