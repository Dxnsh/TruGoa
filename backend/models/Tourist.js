import mongoose from "mongoose";

// BUG FIX: type:"String" (string literal) changed to type:String (constructor)
const touristSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
  },
  googleId: { type: String, required: true, unique: true },
  avatar:   { type: String },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Business" }],
}, { timestamps: true });

touristSchema.index({ createdAt: -1 });
export default mongoose.model("Tourist", touristSchema);