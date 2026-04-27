import mongoose from "mongoose";

// BUG FIX: type:"String" (string literal) changed to type:String (constructor)
const touristSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  avatar:   { type: String },
}, { timestamps: true });

touristSchema.index({ createdAt: -1 });
export default mongoose.model("Tourist", touristSchema);