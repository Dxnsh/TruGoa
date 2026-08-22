// Creates or updates a dashboard admin directly in the database.
//
//   node scripts/createAdmin.js <email> [password] [name] [role]
//
// Omit the password and it is asked for and typed invisibly, which is the
// better way: a password on the command line is mangled by whichever
// characters your shell treats as syntax (& splits the command on Windows)
// and is left behind in shell history.
//
// This is the way back in when nobody can sign in — a forgotten password, or
// the env-var bootstrap declining to seed. It talks to MONGO_URI from .env, so
// pointing it at the production connection string manages production accounts.
//
// The password is taken as an argument and hashed here; the plaintext is never
// stored or logged. Re-running with an existing email resets that account's
// password and reactivates it rather than failing on the unique index.
import "dotenv/config";
import readline from "node:readline";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import AdminUser from "../models/AdminUser.js";

// Prompts without echoing what is typed — the prompt itself is written before
// output is muted, so the label still shows but the password never appears.
const askHidden = (query) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let muted = false;
  rl._writeToOutput = (chunk) => { if (!muted) rl.output.write(chunk); };
  rl.question(query, (value) => { rl.close(); process.stdout.write("\n"); resolve(value); });
  muted = true;
});

const BCRYPT_ROUNDS = 12;
const PASSWORD_MIN = 10;

const [, , email, passwordArg, name = "Owner", role = "owner"] = process.argv;

if (!email) {
  console.error("Usage: node scripts/createAdmin.js <email> [password] [name] [role]");
  process.exit(1);
}

const password = passwordArg || await askHidden(`Password for ${email} (at least ${PASSWORD_MIN} characters, not shown): `);

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
