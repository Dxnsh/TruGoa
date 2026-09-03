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

// ── POST /admin/businesses ────────────────────────────────────────────────
// Admin-curated content only — created directly as "approved".
export const createBusiness = asyncHandler(async (req, res) => {
  const {
    name, location, category, subCategory,
    tagline, description, story, localTip,
    highlights, mustTry, bestTime, idealFor,
    area, latitude, longitude, googleMapUrl,
    priceRange, priceLevel, openingHours, phone, website,
    heroImage, gallery,
    scamAlert, safetyTip,
    tags, featured, editorPick,
  } = req.body;

  const business = await Business.create(cleanEnums({
    name: name.trim(),
    location: location.trim(),
    category: category.toLowerCase(),
    subCategory, tagline, description, story, localTip,
    highlights: highlights || [],
    mustTry: mustTry || [],
    bestTime,
    idealFor: idealFor || [],
    area, latitude, longitude, googleMapUrl,
    priceRange, priceLevel, openingHours, phone, website,
    heroImage,
    gallery: gallery || [],
    scamAlert, safetyTip,
    tags: tags || [],
    featured: !!featured,
    editorPick: !!editorPick,
    status: "approved",
    verified: true,
    reviewedAt: new Date(),
  }));

  sendSuccess(res, { statusCode: 201, message: "Business created", data: business });
});

// ── PUT /admin/businesses/:id ─────────────────────────────────────────────
const BUSINESS_EDITABLE_FIELDS = [
  "name", "location", "category", "subCategory",
  "tagline", "description", "story", "localTip",
  "highlights", "mustTry", "bestTime", "idealFor",
  "area", "latitude", "longitude", "googleMapUrl",
  "priceRange", "priceLevel", "openingHours", "phone", "website",
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

  const business = await Business.findByIdAndUpdate(req.params.id, updates, {
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
  const [total, pending, approved, rejected] = await Promise.all([
    Business.countDocuments(),
    Business.countDocuments({ status: "pending" }),
    Business.countDocuments({ status: "approved" }),
    Business.countDocuments({ status: "rejected" }),
  ]);

  sendSuccess(res, { data: { total, pending, approved, rejected } });
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
