import jwt from "jsonwebtoken";
import Business from "../models/Business.js";
import AdminUser from "../models/AdminUser.js";
import Tourist from "../models/Tourist.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyPassword } from "../utils/passwordAuth.js";
import { paginationFrom, paginated } from "./businessController.js";

// ── POST /admin/login ──────────────────────────────────────────────────────
// Credentials live in the AdminUser collection, one document per person, so
// access can be granted and revoked individually. See utils/bootstrapAdmin.js
// for how the first owner gets created.
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await AdminUser.findOne({ email: email.trim().toLowerCase() })
    .select("+passwordHash");

  // Compare against a dummy hash when no account matched, so a missing email
  // and a wrong password take the same time to answer. Skipping the compare
  // would make unknown emails measurably faster and let someone enumerate
  // which addresses are admins.
  //
  // The dummy used to be a hand-written "$2a$10$invalidinvalid…" string, which
  // is not a valid bcrypt hash: the salt fails to decode, so compare returned
  // false in ~0 ms instead of doing the ~105 ms of key derivation a real one
  // costs. The defence was there in shape only, and the timing gap it was
  // meant to close stayed wide open. verifyPassword falls back to a genuine
  // hash of random bytes instead — see utils/passwordAuth.js.
  const passwordOk = await verifyPassword(password, admin?.passwordHash);

  // Deactivated accounts are rejected here rather than at the token check, so
  // revoking someone takes effect on their next sign-in attempt immediately.
  if (!admin || !passwordOk || !admin.active) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  // Checked here rather than letting jwt.sign throw, so a missing variable
  // reports itself instead of arriving as an unexplained 500.
  if (!process.env.ADMIN_JWT_SECRET) {
    throw new ApiError(500, "Server misconfigured: ADMIN_JWT_SECRET is not set");
  }

  const token = jwt.sign(
    { sub: admin._id.toString(), role: admin.role },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: "1d" }
  );

  admin.lastLoginAt = new Date();
  await admin.save();

  sendSuccess(res, {
    message: "Login successful",
    data: {
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    },
  });
});

// enum fields whose schema definitions don't allow "" — an unselected
// dropdown must become undefined, not an empty string, or Mongoose validation fails
const ENUM_FIELDS = ["category", "area", "priceLevel"];
const cleanEnums = (obj) => {
  for (const field of ENUM_FIELDS) {
    if (obj[field] === "") obj[field] = undefined;
  }
  return obj;
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// The admin hours editor sends a full 7-day object with blank/partial rows for
// days left untouched. Store only what's actually meaningful:
//   - is24Hours wins and makes the per-day rows moot, so they're dropped
//   - a day marked closed stores just { closed: true }
//   - a day stores its periods that have BOTH a valid HH:MM open and close
//   - a half-filled period is dropped — isPlaceOpenNow would treat a stray
//     "09:00" as a real edge — and a day with no surviving period is omitted
// If nothing survives, the whole field becomes undefined so the listing reads
// as "hours unknown" (always shown, no badge) rather than an empty shell.
const cleanOpeningHours = (raw) => {
  if (!raw || typeof raw !== "object") return undefined;
  if (raw.is24Hours === true) return { is24Hours: true };

  const out = {};
  for (const day of DAYS) {
    const entry = raw[day];
    if (!entry || typeof entry !== "object") continue;
    if (entry.closed === true) { out[day] = { closed: true }; continue; }

    const rawPeriods = Array.isArray(entry.periods)
      ? entry.periods
      : (entry.open || entry.close ? [{ open: entry.open, close: entry.close }] : []);

    const periods = rawPeriods
      .filter((p) => p && HHMM.test(p.open || "") && HHMM.test(p.close || "") && p.open !== p.close)
      .map((p) => ({ open: p.open, close: p.close }));

    if (periods.length) out[day] = { closed: false, periods };
  }
  return Object.keys(out).length ? out : undefined;
};

// Applied to whichever payload a write is about to use — `openingHours` only
// gets normalised when the caller actually sent it, so an edit that doesn't
// touch hours leaves the stored ones alone.
const cleanHoursField = (obj) => {
  if ("openingHours" in obj) obj.openingHours = cleanOpeningHours(obj.openingHours);
  return obj;
};

// ── POST /admin/businesses ────────────────────────────────────────────────
// Admin-curated content only — created directly as "approved".
export const createBusiness = asyncHandler(async (req, res) => {
  const {
    name, location, category, subCategory,
    tagline, description, story, localTip,
    highlights, mustTry, bestTime, idealFor,
    area, latitude, longitude, googleMapUrl,
    priceRange, priceLevel, openingHours, openingHoursNote, phone, website,
    heroImage, gallery,
    scamAlert, safetyTip,
    tags, featured, editorPick,
  } = req.body;

  const business = await Business.create(cleanEnums(cleanHoursField({
    name: name.trim(),
    location: location.trim(),
    category: category.toLowerCase(),
    subCategory, tagline, description, story, localTip,
    highlights: highlights || [],
    mustTry: mustTry || [],
    bestTime,
    idealFor: idealFor || [],
    area, latitude, longitude, googleMapUrl,
    priceRange, priceLevel, openingHours, openingHoursNote, phone, website,
    heroImage,
    gallery: gallery || [],
    scamAlert, safetyTip,
    tags: tags || [],
    featured: !!featured,
    editorPick: !!editorPick,
    status: "approved",
    verified: true,
    reviewedAt: new Date(),
  })));

  sendSuccess(res, { statusCode: 201, message: "Business created", data: business });
});

// ── PUT /admin/businesses/:id ─────────────────────────────────────────────
const BUSINESS_EDITABLE_FIELDS = [
  "name", "location", "category", "subCategory",
  "tagline", "description", "story", "localTip",
  "highlights", "mustTry", "bestTime", "idealFor",
  "area", "latitude", "longitude", "googleMapUrl",
  "priceRange", "priceLevel", "openingHours", "openingHoursNote", "phone", "website",
  "heroImage", "gallery",
  "scamAlert", "safetyTip",
  "tags", "featured", "editorPick", "featuredStory",
  "visitDuration", "season",
];

export const updateBusiness = asyncHandler(async (req, res) => {
  const updates = {};
  for (const field of BUSINESS_EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.name) updates.name = updates.name.trim();
  if (updates.location) updates.location = updates.location.trim();
  if (updates.category) updates.category = updates.category.toLowerCase();
  cleanEnums(updates);
  cleanHoursField(updates);

  // cleanOpeningHours collapses a blank editor to undefined, and Mongoose drops
  // undefined values from an update rather than clearing the field — so an admin
  // wiping every day would leave the old hours in place. Turn that into an
  // explicit $unset so "cleared" means cleared.
  let mongoUpdate = updates;
  if ("openingHours" in updates && updates.openingHours === undefined) {
    const { openingHours, ...rest } = updates;
    mongoUpdate = { ...rest, $unset: { openingHours: "" } };
  }

  const business = await Business.findByIdAndUpdate(req.params.id, mongoUpdate, {
    new: true,
    runValidators: true,
  });
  if (!business) throw new ApiError(404, "Business not found");

  sendSuccess(res, { message: "Business updated", data: business });
});

// ── DELETE /admin/businesses/:id ──────────────────────────────────────────
export const deleteBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findByIdAndDelete(req.params.id);
  if (!business) throw new ApiError(404, "Business not found");

  // Saved lists kept pointing at the deleted document. populate() drops a
  // dangling reference without saying so, so the entry stayed in the array
  // forever while the tourist saw their saved count disagree with the page.
  await Tourist.updateMany(
    { favorites: business._id },
    { $pull: { favorites: business._id } }
  );

  sendSuccess(res, { message: "Business deleted" });
});

// ── GET /admin/businesses ─────────────────────────────────────────────────
// One page of businesses, every status included, newest first.
// Query: ?page= &limit= &status= &search=
//
// This was an unbounded Business.find() across the whole collection. Whole
// documents are still returned — the dashboard opens its edit form straight
// from a row, so a trimmed projection would silently drop fields on save —
// but the row count is now capped.
//
// Search runs here rather than in the browser: with results split across
// pages, filtering client-side would only ever search the page in hand.
const escapeRegexAdmin = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllBusinesses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationFrom(req.query, 50, 200);

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const term = escapeRegexAdmin(req.query.search);
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { location: { $regex: term, $options: "i" } },
      { category: { $regex: term, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Business.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Business.countDocuments(filter),
  ]);

  sendSuccess(res, { data: paginated(items, total, page, limit) });
});

// ── GET /admin/stats ──────────────────────────────────────────────────────
export const getStats = asyncHandler(async (req, res) => {
  const [total, pending, approved, rejected, missingHours] = await Promise.all([
    Business.countDocuments(),
    Business.countDocuments({ status: "pending" }),
    Business.countDocuments({ status: "approved" }),
    Business.countDocuments({ status: "rejected" }),
    // Approved listings with no structured hours — these show in the feed with
    // no "open now" badge and are never filtered out. Surfaced in the dashboard
    // so the gap gets closed with real hours rather than guessed defaults.
    Business.countDocuments({
      status: "approved",
      $or: [{ openingHours: { $exists: false } }, { openingHours: null }],
    }),
  ]);

  sendSuccess(res, { data: { total, pending, approved, rejected, missingHours } });
});

// ── PATCH /admin/businesses/:id/approve ───────────────────────────────────
export const approveBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findByIdAndUpdate(
    req.params.id,
    { status: "approved", verified: true, rejectionReason: null, reviewedAt: new Date() },
    { new: true }
  );
  if (!business) throw new ApiError(404, "Business not found");

  sendSuccess(res, { message: "Business approved", data: business });
});

// ── PATCH /admin/businesses/:id/reject ────────────────────────────────────
// body: { reason: "string" }  — reason is sent back to the business owner
export const rejectBusiness = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const business = await Business.findByIdAndUpdate(
    req.params.id,
    {
      status: "rejected",
      verified: false,
      rejectionReason: reason || "Does not meet TruGoa listing standards.",
      reviewedAt: new Date(),
    },
    { new: true }
  );
  if (!business) throw new ApiError(404, "Business not found");

  sendSuccess(res, { message: "Business rejected", data: business });
});
