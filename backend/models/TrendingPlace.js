import mongoose from "mongoose";

const trendingPlaceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    longDescription: { type: String, default: "" },
    badge: {
      type: String,
      enum: ["TRENDING", "POPULAR", "HIDDEN GEM", "TONIGHT", "WHAT'S HOT"],
      default: "TRENDING",
    },
    image: { type: String, required: true },
    gallery: [{ type: String }],
    avatars: [{ type: String }],
    lovedCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    relatedBusiness: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
  },
  { timestamps: true }
);

trendingPlaceSchema.index({ isActive: 1, order: 1 });

export default mongoose.model("TrendingPlace", trendingPlaceSchema);