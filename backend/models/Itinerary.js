import mongoose from "mongoose";

// One saved itinerary per tourist — generating a new one overwrites the last.
const itinerarySchema = new mongoose.Schema({
  tourist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tourist",
    required: true,
    unique: true,
  },
  form: {
    duration:  { type: String, required: true },
    budget:    { type: String, required: true },
    vibe:      { type: String, required: true },
    interests: [{ type: String }],
    style:     { type: String, required: true },
  },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default mongoose.model("Itinerary", itinerarySchema);
