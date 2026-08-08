import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Business from "../models/Business.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// ── POST /admin/login ──────────────────────────────────────────────────────
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const isMatch = email === process.env.ADMIN_EMAIL
    && await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

  if (!isMatch) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  const token = jwt.sign({ role: "admin" }, process.env.ADMIN_JWT_SECRET, { expiresIn: "1d" });

  sendSuccess(res, { message: "Login successful", data: { token } });
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

  sendSuccess(res, { message: "Business deleted" });
});

// ── GET /admin/businesses ─────────────────────────────────────────────────
// Returns ALL businesses (all statuses) for admin review
export const getAllBusinesses = asyncHandler(async (req, res) => {
  const businesses = await Business.find().sort({ createdAt: -1 });
  sendSuccess(res, { data: businesses });
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
