import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({

  // ── IDENTITY ──────────────────────────────────────────────────────────────
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, unique: true, sparse: true },
  category: {
    type: String,
    required: true,
    lowercase: true,
    enum: [
      "restaurant",
      "cafe",
      "hotel",
      "stay",
      "beach",
      "activity",
      "market",
      "heritage",
      "nightlife",
    ],
  },
  subCategory: { type: String, trim: true }, // e.g. "seafood", "heritage hotel"

  // ── CONTENT ───────────────────────────────────────────────────────────────
  tagline:     { type: String, trim: true, maxlength: 150 },  // "Best prawn curry on Baga Beach"
  description: { type: String, maxlength: 3000 },              // 2–3 paragraph overview
  story:       { type: String, maxlength: 5000 },              // deeper narrative, history, why it exists
  localTip:    { type: String, maxlength: 1000 },              // insider advice tourists won't find on Google
  highlights:  [{ type: String }],            // ["Fresh catch daily", "No tourist markup"]
  mustTry:     [{ type: String }],            // ["Prawn balchão", "Bebinca"]
  bestTime:    { type: String },              // "November–February, arrive before 1pm"
  idealFor:    [{ type: String }],            // ["couples", "families", "solo", "budget"]


 tags: {
   type: [String],
   default: [],
},

featuredStory: {
   type: Boolean,
   default: false,
},

visitDuration: {
   type: String,
},

season: [{
   type: String,
}],


  // ── LOCATION ──────────────────────────────────────────────────────────────
  location:     { type: String, required: true, trim: true }, // "Baga Beach, North Goa"
  area: {
    type: String,
    lowercase: true,
    enum: ["north-goa", "south-goa", "panaji", "central-goa"],
  },
  latitude:     { type: Number, min: -90,  max: 90 },
  longitude:    { type: Number, min: -180, max: 180 },
  googleMapUrl: { type: String },

  // ── PRACTICAL INFO ────────────────────────────────────────────────────────
  priceRange:   { type: String },              // "₹400–₹800 per person"
  priceLevel: {
    type: String,
    enum: ["budget", "mid", "premium"],
  },
  openingHours: { type: String },              // "8am – 11pm daily"
  phone:        { type: String },
  website:      { type: String },

  // ── MEDIA ─────────────────────────────────────────────────────────────────
  heroImage:    { type: String },              // main cover photo URL
  gallery:      [{ type: String }],            // additional photo URLs

  // ── SAFETY (TruGoa's unique value) ───────────────────────────────────────
  scamAlert:    { type: String, maxlength: 500 },              // "Don't pay touts outside — use official counter"
  safetyTip:    { type: String, maxlength: 500 },

  // ── TRUST & STATUS ────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  verified:        { type: Boolean, default: false },
  featured:        { type: Boolean, default: false },
  editorPick:      { type: Boolean, default: false },
  rejectionReason: { type: String,  default: null },
  reviewedAt:      { type: Date,    default: null },

  // ── OWNER ─────────────────────────────────────────────────────────────────
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    default: null,
  },

  // ── STATS (auto-updated by review system later) ───────────────────────────
  rating:      { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

}, { timestamps: true });

// ── AUTO-GENERATE SLUG FROM NAME ──────────────────────────────────────────────
businessSchema.pre("save", function () {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }
});

// ── INDEXES ───────────────────────────────────────────────────────────────────
businessSchema.index({ status: 1 });
businessSchema.index({ category: 1, status: 1 });
businessSchema.index({ area: 1, status: 1 });
businessSchema.index({ priceLevel: 1, status: 1 });
businessSchema.index({ featured: -1, createdAt: -1 });
businessSchema.index({ name: "text", description: "text", story: "text" });

export default mongoose.model("Business", businessSchema);