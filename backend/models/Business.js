import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
{
  name: { type: String, required: true },
  location: { type: String, required: true },
  category: String,
  price_range: String,
  trust_level: { type: String, default: "risky" },
  rating: { type: Number, default: 0 },
  review_count: { type: Number, default: 0 },
  description: String,
  contact: String,
  images: [{ type: String }],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    default: null
  }
},
{ timestamps: true }
);

businessSchema.index({ status: 1 });
businessSchema.index({ category: 1, status: 1 });
businessSchema.index({ owner: 1, status: 1 });
businessSchema.index({ name: "text", description: "text" });
businessSchema.index({ createdAt: -1 });

export default mongoose.model("Business", businessSchema);