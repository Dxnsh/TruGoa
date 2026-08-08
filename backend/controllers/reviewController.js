// controllers/reviewController.js
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Business from "../models/Business.js";
import { clearCache } from "../middleware/cacheMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/* =====================================================
   HELPERS
   Recalculates from the reviews collection itself (a
   single aggregate) rather than incrementing counters on
   the business doc — safe under concurrent writes since
   it never depends on the previous in-memory value.
===================================================== */

const recalculateBusinessRating = async (businessId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        business_id: new mongoose.Types.ObjectId(businessId),
        status: "published",
      },
    },
    {
      $group: {
        _id: "$business_id",
        avgRating: { $avg: "$rating" },
        total: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avgRating || 0;
  const total = stats[0]?.total || 0;

  await Business.findByIdAndUpdate(businessId, {
    rating: Math.round(avg * 10) / 10,
    reviewCount: total,
  });

  clearCache(`/api/v1/businesses`);
};

/* =====================================================
   POST /reviews
   Add Review — if a tourist is signed in (optionalTourist
   middleware), identity is taken from the verified token,
   not trusted from the request body.
===================================================== */

export const addReview = asyncHandler(async (req, res) => {
  const { business_id, city, country, rating, title, comment, images, tags } = req.body;
  const name = req.user ? req.user.name : req.body.name;
  const tourist_id = req.user ? req.user._id : null;

  const business = await Business.findById(business_id).select("_id");
  if (!business) throw new ApiError(404, "Business not found.");

  let review;
  try {
    review = await Review.create({
      business_id,
      tourist_id,
      name: String(name).trim(),
      avatar: req.user?.avatar || "",
      city: city || "",
      country: country || "",
      rating,
      title: title || "",
      comment: comment.trim(),
      images: Array.isArray(images) ? images.slice(0, 6) : [],
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      helpfulCount: 0,
      status: "published",
    });
  } catch (err) {
    // Duplicate-key from the unique (business_id, tourist_id) index —
    // two concurrent submits from the same signed-in tourist.
    if (err.code === 11000) {
      throw new ApiError(409, "You already reviewed this place.");
    }
    throw err;
  }

  await recalculateBusinessRating(business_id);

  sendSuccess(res, { statusCode: 201, message: "Review added successfully.", data: review });
});

/* =====================================================
   GET /reviews?business_id=xxx
===================================================== */

export const getReviewsForBusiness = asyncHandler(async (req, res) => {
  const { business_id } = req.query;

  const reviews = await Review.find({
    business_id,
    status: "published",
  }).sort({ createdAt: -1 }).limit(200);

  sendSuccess(res, { data: { total: reviews.length, reviews } });
});

/* =====================================================
   PATCH /reviews/:id/helpful
   Atomic increment — safe when many tourists click at once.
===================================================== */

export const markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $inc: { helpfulCount: 1 } },
    { new: true }
  ).select("helpfulCount");

  if (!review) throw new ApiError(404, "Review not found.");

  sendSuccess(res, { data: { helpfulCount: review.helpfulCount } });
});

/* =====================================================
   PATCH /reviews/:id/reply
   Owner/Admin Reply
===================================================== */

export const ownerReply = asyncHandler(async (req, res) => {
  const { text } = req.body;

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { ownerReply: { text: text.trim(), repliedAt: new Date() } },
    { new: true }
  );

  if (!review) throw new ApiError(404, "Review not found.");

  sendSuccess(res, { message: "Reply added.", data: review });
});

/* =====================================================
   DELETE /reviews/:id
===================================================== */

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found.");

  const businessId = review.business_id;

  await review.deleteOne();
  await recalculateBusinessRating(businessId);

  sendSuccess(res, { message: "Review deleted." });
});
