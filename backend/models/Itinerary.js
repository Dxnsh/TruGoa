import mongoose from "mongoose";

// One slot in a day — a single place to be at a particular time. Shapes match
// what both generators actually produce: the curated fallback in
// controllers/itineraryController.js and the AI path, whose JSON contract is
// declared in ITINERARY_SYSTEM_PROMPT and validated before it reaches here.
const slotSchema = new mongoose.Schema({
  time:          { type: String, trim: true, maxlength: 40 },
  period:        { type: String, trim: true, enum: ["Morning", "Afternoon", "Evening", "Night"] },
  place:         { type: String, required: true, trim: true, maxlength: 200 },
  area:          { type: String, trim: true, maxlength: 200 },
  type:          { type: String, trim: true, maxlength: 80 },
  description:   { type: String, maxlength: 2000 },
  insiderTip:    { type: String, maxlength: 1000 },
  estimatedCost: { type: String, trim: true, maxlength: 80 },
}, { _id: false });

const daySchema = new mongoose.Schema({
  day:     { type: Number, required: true, min: 1, max: 30 },
  title:   { type: String, required: true, trim: true, maxlength: 200 },
  theme:   { type: String, maxlength: 500 },
  dayCost: { type: String, trim: true, maxlength: 80 },
  // A day is capped at the slot count the generators can produce (3-4) with
  // headroom, so a hand-crafted request can't store hundreds per day.
  slots:   { type: [slotSchema], required: true, validate: [(v) => v.length > 0 && v.length <= 10, "A day needs 1-10 slots"] },
}, { _id: false });

// The generated itinerary itself.
//
// This was `mongoose.Schema.Types.Mixed`, which validates nothing: /save took
// whatever JSON the client sent and stored it verbatim under the tourist's
// account. Any shape, any size, any keys — the 1MB body limit was the only
// ceiling, and /mine handed it straight back to be rendered. Declaring the real
// structure means a malformed or oversized blob is rejected on the way in
// rather than discovered when a page tries to draw it.
const itineraryDataSchema = new mongoose.Schema({
  title:          { type: String, required: true, trim: true, maxlength: 200 },
  tagline:        { type: String, trim: true, maxlength: 300 },
  overview:       { type: String, maxlength: 2000 },
  coverMood:      { type: String, trim: true, maxlength: 120 },
  totalBudget:    { type: String, trim: true, maxlength: 80 },
  bestSeason:     { type: String, trim: true, maxlength: 80 },
  practicalNotes: { type: String, maxlength: 2000 },
  days: {
    type: [daySchema],
    required: true,
    validate: [(v) => v.length > 0 && v.length <= 30, "An itinerary needs 1-30 days"],
  },
}, { _id: false });

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
  data: { type: itineraryDataSchema, required: true },
}, { timestamps: true });

export default mongoose.model("Itinerary", itinerarySchema);
