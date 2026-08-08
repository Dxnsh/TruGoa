import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  desc:  { type: String, trim: true },
  image: { type: String },
}, { _id: false });

const subStorySchema = new mongoose.Schema({
  slug:      { type: String, required: true, trim: true },
  title:     { type: String, required: true, trim: true },
  excerpt:   { type: String, trim: true },
  image:     { type: String },
  readTime:  { type: String },
  pullQuote: { type: String },

  // ── Article deep-dive content (Reiek-style single-place layout) ──────────
  location:    { type: String, trim: true },   // "Agonda, South Goa"
  latitude:    { type: Number, min: -90,  max: 90 },
  longitude:   { type: Number, min: -180, max: 180 },

  introTitle:  { type: String, trim: true },    // "Mizoram's jewel" equivalent
  introBody:   { type: String },                // longer intro paragraph, "Read more"-able

  activities:  [activitySchema],                // "Indulge in Unique Experiences" cards

  nearestAirport:  { type: String, trim: true }, // "Bodh Gaya Airport (GAY)"
  nearestRailway:  { type: String, trim: true }, // "Gaya Junction Railway Station (GAYA)"
}, { _id: false });

const storySchema = new mongoose.Schema({
  category:       { type: String, required: true, trim: true }, // "DESTINATIONS"
  slug:            { type: String, required: true, unique: true, trim: true, lowercase: true },
  title:           { type: String, required: true, trim: true, maxlength: 200 },
  desc:            { type: String, trim: true, maxlength: 500 },
  image:           { type: String, required: true },
  readTime:        { type: String },
  manifestoTitle:  { type: String, trim: true, maxlength: 200 },
  manifestoText1:  { type: String, maxlength: 2000 },
  manifestoText2:  { type: String, maxlength: 2000 },
  stories:         [subStorySchema],
}, { timestamps: true });

export default mongoose.model("Story", storySchema);
