// controllers/reviewController.js

import mongoose from "mongoose";
import Review from "../models/Review.js";
import Business from "../models/Business.js";

/* =====================================================
   HELPERS
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
    review_count: total,
  });
};

/* =====================================================
   POST /api/reviews
   Add Review
===================================================== */

export const addReview = async (req, res) => {
  try {
    const {
      business_id,
      name,
      city,
      country,
      rating,
      title,
      comment,
      images,
      tags,
      tourist_id,
    } = req.body;

    /* ---------- Validation ---------- */
    if (!business_id || !name || !rating || !comment) {
      return res.status(400).json({
        error: "business_id, name, rating and comment are required.",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5.",
      });
    }

    if (comment.trim().length < 10) {
      return res.status(400).json({
        error: "Review comment is too short.",
      });
    }

    /* ---------- Check Business ---------- */
    const business = await Business.findById(business_id);

    if (!business) {
      return res.status(404).json({
        error: "Business not found.",
      });
    }

    /* ---------- Prevent Duplicate Review ---------- */
    if (tourist_id) {
      const alreadyReviewed = await Review.findOne({
        business_id,
        tourist_id,
      });

      if (alreadyReviewed) {
        return res.status(409).json({
          error: "You already reviewed this place.",
        });
      }
    }

    /* ---------- Create Review ---------- */
    const review = await Review.create({
      business_id,
      tourist_id: tourist_id || null,
      name: name.trim(),
      city: city || "",
      country: country || "",
      rating,
      title: title || "",
      comment: comment.trim(),
      images: images || [],
      tags: tags || [],
      verifiedBooking: false,
      helpfulCount: 0,
      status: "published",
    });

    /* ---------- Recalculate Rating ---------- */
    await recalculateBusinessRating(business_id);

    res.status(201).json({
      success: true,
      message: "Review added successfully.",
      review,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

/* =====================================================
   GET /api/reviews?business_id=xxx
===================================================== */

export const getReviewsForBusiness = async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({
        error: "business_id query param required.",
      });
    }

    const reviews = await Review.find({
      business_id,
      status: "published",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

/* =====================================================
   PATCH /api/reviews/:id/helpful
===================================================== */

export const markHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        error: "Review not found.",
      });
    }

    res.json({
      success: true,
      helpfulCount: review.helpfulCount,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

/* =====================================================
   PATCH /api/reviews/:id/reply
   Owner Reply
===================================================== */

export const ownerReply = async (req, res) => {
  try {
    const { text } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        ownerReply: {
          text,
          repliedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        error: "Review not found.",
      });
    }

    res.json({
      success: true,
      message: "Reply added.",
      review,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE /api/reviews/:id
===================================================== */

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        error: "Review not found.",
      });
    }

    const businessId = review.business_id;

    await review.deleteOne();

    await recalculateBusinessRating(businessId);

    res.json({
      success: true,
      message: "Review deleted.",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};