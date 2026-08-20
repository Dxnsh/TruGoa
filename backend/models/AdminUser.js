import mongoose from "mongoose";

// One document per person who can sign in to the dashboard, replacing the
// single shared credential that used to live in ADMIN_EMAIL / ADMIN_PASSWORD_HASH.
//
// Two roles:
//   owner  — everything an editor can do, plus managing this list
//   editor — content only (businesses, stories, journal)
const adminUserSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },

  // bcrypt hash — never the plaintext. Excluded from queries by default so a
  // stray .find() can't leak every hash into a JSON response.
  passwordHash: { type: String, required: true, select: false },

  role: { type: String, enum: ["owner", "editor"], default: "editor" },

  // Deactivating is preferred over deleting: it revokes access immediately
  // while leaving the name attached to whatever the person already published.
  active: { type: Boolean, default: true },

  lastLoginAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("AdminUser", adminUserSchema);
