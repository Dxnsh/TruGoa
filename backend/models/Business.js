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

  // GeoJSON mirror of latitude/longitude, kept in sync by the pre-save hook
  // below. Mongo's $near/$geoNear can only read a GeoJSON field with a
  // 2dsphere index, so the flat lat/lng pair above can't drive the "places
  // near me" query on its own. Note the coordinate order is [lng, lat] —
  // GeoJSON is longitude-first, the reverse of how we store/display it.
  // Docs without coordinates leave this undefined so they simply drop out of
  // proximity results rather than landing at [0,0] off the coast of Africa.
  geo: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: (v) => !v || v.length === 2,
        message: "geo.coordinates must be [longitude, latitude]",
      },
    },
  },

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

// ── KEEP GeoJSON IN SYNC WITH latitude/longitude ──────────────────────────────
// latitude/longitude stay the source of truth (that's what the admin form
// edits and what every existing document already has). This mirrors them into
// `geo` so proximity search keeps working after an edit, instead of silently
// querying against stale coordinates.
businessSchema.pre("save", function () {
  if (!this.isModified("latitude") && !this.isModified("longitude")) return;

  if (typeof this.latitude === "number" && typeof this.longitude === "number") {
    this.geo = { type: "Point", coordinates: [this.longitude, this.latitude] };
  } else {
    // Coordinates were cleared — drop the point so the doc falls out of
    // proximity results rather than keeping a stale location.
    this.geo = undefined;
  }
});

// The admin dashboard saves via findByIdAndUpdate, which skips document
// middleware entirely, so the same sync has to be repeated for update queries.
businessSchema.pre(["findOneAndUpdate", "updateOne"], function () {
  const update = this.getUpdate();
  if (!update) return;

  const $set = update.$set || update;
  const lat = $set.latitude;
  const lng = $set.longitude;
  if (lat === undefined && lng === undefined) return;

  if (typeof lat === "number" && typeof lng === "number") {
    $set.geo = { type: "Point", coordinates: [lng, lat] };
  } else {
    $set.geo = undefined;
  }
  this.setUpdate(update);
});

// ── INDEXES ───────────────────────────────────────────────────────────────────
businessSchema.index({ status: 1 });
businessSchema.index({ category: 1, status: 1 });
businessSchema.index({ area: 1, status: 1 });
businessSchema.index({ priceLevel: 1, status: 1 });
businessSchema.index({ featured: -1, createdAt: -1 });
businessSchema.index({ name: "text", description: "text", story: "text" });
// Required by $near / $geoNear — proximity search errors out without it.
businessSchema.index({ geo: "2dsphere" });

export default mongoose.model("Business", businessSchema);