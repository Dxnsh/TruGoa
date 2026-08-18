import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  slug:      { type: String, required: true, unique: true, trim: true, lowercase: true },
  title:     { type: String, required: true, trim: true, maxlength: 200 },
  excerpt:   { type: String, trim: true, maxlength: 500 },
  content:   { type: String, required: true },
  coverImage: { type: String, required: true },
  author:    { type: String, trim: true, default: "TruGoa Team" },
  readTime:  { type: String },
  tags:      [{ type: String, trim: true }],
}, { timestamps: true });

export default mongoose.model("Blog", blogSchema);
