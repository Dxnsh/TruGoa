import express from "express";
import {
  addReview,
  getReviewsForBusiness,
  markHelpful,
  ownerReply,
  deleteReview,
} from "../controllers/reviewController.js";
import { optionalTourist, protectTourist } from "../middleware/authMiddleware.js";
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
// Signed in, and under the review limiter rather than the blanket API one:
// a helpful vote is a write against the trust signals, same as posting a
// review, so it belongs on the same budget.
router.patch("/:id/helpful", reviewLimiter, protectTourist, reviewIdParamRules, validate, markHelpful);

/* Admin-moderated (no owner-review linkage exists yet) */
router.patch("/:id/reply", adminAuth, ownerReplyRules, validate, ownerReply);
router.delete("/:id", adminAuth, reviewIdParamRules, validate, deleteReview);

export default router;
