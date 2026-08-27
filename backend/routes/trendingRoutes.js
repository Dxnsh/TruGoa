import express from "express";
import TrendingPlace from "../models/TrendingPlace.js";
import requireAdmin from "../middleware/requireAdmin.js"; // swap for your actual admin auth middleware

const router = express.Router();

// PUBLIC — active trending places, in display order
router.get("/", async (req, res) => {
  try {
    const items = await TrendingPlace.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to load trending places" });
  }
});

// ADMIN — everything, including inactive
router.get("/admin/all", requireAdmin, async (req, res) => {
  try {
    const items = await TrendingPlace.find().sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to load trending places" });
  }
});

// PUBLIC — single place for the detail page
router.get("/:slug", async (req, res) => {
  try {
    const item = await TrendingPlace.findOne({ slug: req.params.slug, isActive: true });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to load place" });
  }
});

// ADMIN — create
router.post("/", requireAdmin, async (req, res) => {
  try {
    const item = await TrendingPlace.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN — update
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const item = await TrendingPlace.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN — delete
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const item = await TrendingPlace.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete" });
  }
});

// ADMIN — bulk reorder, e.g. after drag-and-drop in the admin list
router.patch("/reorder", requireAdmin, async (req, res) => {
  try {
    const { order } = req.body; // [{ id, order }, ...]
    await Promise.all(order.map(({ id, order: pos }) => TrendingPlace.findByIdAndUpdate(id, { order: pos })));
    res.json({ message: "Reordered" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reorder" });
  }
});

export default router;