import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  name:    { type: String, required: true },
  city:    { type: String, default: "" },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);