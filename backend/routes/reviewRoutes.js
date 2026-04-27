import express from "express";
import {
  addReview,
  getReviewsForBusiness,
  markHelpful,
  ownerReply,
  deleteReview
} from "../controllers/reviewController.js";

import { cacheResponse } from "../middleware/cacheMiddleware.js";

const router = express.Router();


router.get("/", getReviewsForBusiness);
router.post("/", addReview);

/* Interactions */
router.patch("/:id/helpful", markHelpful);

/* Owner */
router.patch("/:id/reply", ownerReply);

/* Admin / user delete later auth protect */
router.delete("/:id", deleteReview);

export default router;