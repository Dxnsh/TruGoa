// Creates or updates a dashboard admin directly in the database.
//
//   node scripts/createAdmin.js <email> <password> [name] [role]
//
// This is the way back in when nobody can sign in — a forgotten password, or
// the env-var bootstrap declining to seed. It talks to MONGO_URI from .env, so
// pointing it at the production connection string manages production accounts.
//
// The password is taken as an argument and hashed here; the plaintext is never
// stored or logged. Re-running with an existing email resets that account's
// password and reactivates it rather than failing on the unique index.
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import AdminUser from "../models/AdminUser.js";

const BCRYPT_ROUNDS = 12;
const PASSWORD_MIN = 10;

const [, , email, password, name = "Owner", role = "owner"] = process.argv;

if (!email || !password) {
  console.error("Usage: node scripts/createAdmin.js <email> <password> [name] [role]");
  process.exit(1);
}
if (password.length < PASSWORD_MIN) {
  console.error(`Password must be at least ${PASSWORD_MIN} characters.`);
  process.exit(1);
}
if (!["owner", "editor"].includes(role)) {
  console.error(`Role must be "owner" or "editor" — got "${role}".`);
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

const normalisedEmail = email.trim().toLowerCase();
const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
const existing = await AdminUser.findOne({ email: normalisedEmail });

if (existing) {
  existing.passwordHash = passwordHash;
  existing.role = role;
  existing.active = true;
  await existing.save();
  console.log(`Updated ${normalisedEmail} — role ${role}, active, password reset.`);
} else {
  await AdminUser.create({ name, email: normalisedEmail, passwordHash, role, active: true });
  console.log(`Created ${normalisedEmail} — role ${role}.`);
}

console.log(`Database now holds ${await AdminUser.countDocuments()} admin account(s).`);
await mongoose.disconnect();
