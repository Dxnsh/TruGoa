import express from "express";
import {
  addReview,
  getReviewsForBusiness,
  markHelpful,
  ownerReply,
  deleteReview,
} from "../controllers/reviewController.js";
import { optionalTourist } from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminAuth.js";
import { reviewLimiter } from "../middleware/rateLimiter.js";
import {
  addReviewRules,
  getReviewsRules,
  reviewIdParamRules,
  ownerReplyRules,
} from "../validators/reviewValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.get("/", getReviewsRules, validate, getReviewsForBusiness);
router.post("/", reviewLimiter, optionalTourist, addReviewRules, validate, addReview);

/* Interactions */
router.patch("/:id/helpful", reviewIdParamRules, validate, markHelpful);

/* Admin-moderated (no owner-review linkage exists yet) */
router.patch("/:id/reply", adminAuth, ownerReplyRules, validate, ownerReply);
router.delete("/:id", adminAuth, reviewIdParamRules, validate, deleteReview);

export default router;
