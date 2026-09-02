import express from "express";
import mongoose from "mongoose";
import TrendingPlace from "../models/TrendingPlace.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// The fields the Trending admin form is designed to edit — one entry per
// control in frontend/src/pages/Admin/forms/TrendingForm.jsx.
//
// Everything else on the document is server-controlled and is dropped rather
// than written: _id/__v and the createdAt/updatedAt timestamps, plus
// relatedBusiness, which has no form control and is read by nothing. Passing
// req.body straight to Mongo let a hand-crafted request set any of those, so
// the allowlist is applied on both create and update — the same pattern the
// business, story and journal controllers already use.
const TRENDING_EDITABLE_FIELDS = [
  "title",
  "slug",
  "location",
  "description",
  "longDescription",
  "badge",
  "image",
  "gallery",
  "avatars",
  "lovedCount",
  "order",
  "isActive",
];

const pickEditableFields = (body = {}) => {
  const fields = {};
  for (const field of TRENDING_EDITABLE_FIELDS) {
    if (body[field] !== undefined) fields[field] = body[field];
  }
  return fields;
};

// PUBLIC — active trending places, in display order
router.get("/", async (req, res) => {
  try {
    const items = await TrendingPlace.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load trending places" });
  }
});

// ADMIN — everything, including inactive
router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const items = await TrendingPlace.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load trending places" });
  }
});

// PUBLIC — single place for the detail page
router.get("/:slug", async (req, res) => {
  try {
    const item = await TrendingPlace.findOne({ slug: req.params.slug, isActive: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load place" });
  }
});

// ADMIN — create
router.post("/", adminAuth, async (req, res) => {
  try {
    const item = await TrendingPlace.create(pickEditableFields(req.body));
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN — update
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const item = await TrendingPlace.findByIdAndUpdate(req.params.id, pickEditableFields(req.body), {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN — delete
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const item = await TrendingPlace.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: { message: "Deleted" } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
});

// ADMIN — bulk reorder, e.g. after drag-and-drop in the admin list
router.patch("/reorder", adminAuth, async (req, res) => {
  try {
    const { order } = req.body; // [{ id, order }, ...]

    // Calling .map() on a missing or non-array `order` threw a TypeError inside
    // the try, which the catch below reported as a 500 — a malformed request
    // read as a server fault. Both shape checks answer with a 400 instead, so
    // the caller is told what was wrong with what they sent.
    if (!Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: "`order` must be an array of { id, order } entries",
      });
    }

    const hasInvalidEntry = order.some(
      (entry) =>
        !entry ||
        typeof entry !== "object" ||
        !mongoose.Types.ObjectId.isValid(entry.id) ||
        !Number.isFinite(Number(entry.order))
    );
    if (hasInvalidEntry) {
      return res.status(400).json({
        success: false,
        message: "Each entry must be { id: <valid place id>, order: <number> }",
      });
    }

    await Promise.all(
      order.map(({ id, order: pos }) => TrendingPlace.findByIdAndUpdate(id, { order: Number(pos) }))
    );
    res.json({ success: true, data: { message: "Reordered" } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reorder" });
  }
});

export default router;