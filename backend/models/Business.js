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
        "spiritual",
        "nightlife",
        "art-gallery",
        "museum",
        "library",
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

// A coordinate can arrive as a number or as a numeric string depending on
// which form saved it, and the schema casts strings on the way in either way.
// Treating a string as "no coordinates" would store the pin and drop the point
// that makes it findable — the listing would look correct and match nothing.
const asNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// The admin dashboard saves via findByIdAndUpdate, which skips document
// middleware entirely, so the same sync has to be repeated for update queries.
businessSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function () {
  const update = this.getUpdate();
  // An aggregation-pipeline update states its own $set stages; rewriting one
  // here would corrupt it.
  if (!update || Array.isArray(update)) return;

  // Both bags have to be read. The admin controller passes plain top-level
  // fields, but Mongoose's timestamps plugin gets here first and adds a $set
  // of its own for updatedAt — so `update.$set` exists while the coordinates
  // sit outside it. Reading only $set found nothing, returned early, and left
  // geo unset: the listing saved its latitude and longitude and stayed
  // invisible to every proximity search, which is exactly what it looked like
  // in the data.
  const $set = update.$set || {};
  const sentLat = $set.latitude !== undefined ? $set.latitude : update.latitude;
  const sentLng = $set.longitude !== undefined ? $set.longitude : update.longitude;
  if (sentLat === undefined && sentLng === undefined) return;

  const lat = asNumber(sentLat);
  const lng = asNumber(sentLng);

  // Mongoose folds stray top-level fields into $set while casting, so writing
  // the point there keeps the whole update in one shape.
  update.$set = $set;

  if (lat !== null && lng !== null) {
    update.$set.geo = { type: "Point", coordinates: [lng, lat] };
  } else {
    // Assigning undefined here looks like it clears the point, but Mongoose
    // strips undefined out while casting the update — so the old geo survived
    // and the listing kept matching $geoNear at coordinates it no longer
    // claimed. $unset is the only thing that actually removes it.
    delete update.$set.geo;
    delete update.geo;
    update.$unset = { ...update.$unset, geo: "" };
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