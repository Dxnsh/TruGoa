// models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    business_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    tourist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tourist",
      default: null,
    },

    /* Reviewer Identity */
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    avatar: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    country: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    /* Review Content */
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },

    images: [
      {
        type: String,
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    /* Trust Signals */
    helpfulCount: {
      type: Number,
      default: 0,
    },

    edited: {
      type: Boolean,
      default: false,
    },

    /* Owner Reply */
    ownerReply: {
      text: {
        type: String,
        default: "",
        maxlength: 1000,
      },

      repliedAt: {
        type: Date,
        default: null,
      },
    },

    /* Moderation */
    status: {
      type: String,
      enum: ["published", "hidden", "flagged"],
      default: "published",
    },

    reportCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================
   Indexes
========================================= */

reviewSchema.index({ business_id: 1, createdAt: -1 });
reviewSchema.index({ business_id: 1, rating: -1 });
reviewSchema.index({ tourist_id: 1 });

/* One review per tourist per business — enforced at the DB level so
   concurrent double-submits from the same account can't both land. */
reviewSchema.index(
  { business_id: 1, tourist_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      tourist_id: { $type: "objectId" },
    },
  }
);

export default mongoose.model("Review", reviewSchema);
