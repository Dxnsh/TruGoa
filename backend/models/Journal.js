import mongoose from "mongoose";

const journalSchema = new mongoose.Schema({
  slug:      { type: String, required: true, unique: true, trim: true, lowercase: true },
  title:     { type: String, required: true, trim: true, maxlength: 200 },
  excerpt:   { type: String, trim: true, maxlength: 500 },
  content:   { type: String, required: true },
  coverImage: { type: String, required: true },
  author:    { type: String, trim: true, default: "TruGoa Team" },
  readTime:  { type: String },
  tags:      [{ type: String, trim: true }],
  // Drafts stay in the admin dashboard only — the public listing and detail
  // routes filter on this, so an unfinished entry is never reachable by URL.
  published: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.model("Journal", journalSchema);
