import express from "express";

import businessRoutes  from "./businessRoutes.js";
import adminRoutes     from "./adminRoutes.js";
import authRoutes      from "./authRoutes.js";
import aiRoutes        from "./aiRoutes.js";
import itineraryRoutes from "./itineraryRoutes.js";
import touristRoutes   from "./touristRoutes.js";
import storyRoutes     from "./storyRoutes.js";
import reviewRoutes    from "./reviewRoutes.js";
import journalRoutes   from "./journalRoutes.js";
import contactRoutes   from "./contactRoutes.js";

const router = express.Router();

router.use("/businesses", businessRoutes);
router.use("/admin",      adminRoutes);
router.use("/auth",       authRoutes);
router.use("/ai",         aiRoutes);
router.use("/itinerary",  itineraryRoutes);
router.use("/tourist",    touristRoutes);
router.use("/stories",    storyRoutes);
router.use("/reviews",    reviewRoutes);
router.use("/journals",   journalRoutes);
router.use("/contact",    contactRoutes);
// Legacy alias — /blogs was the original path and may still be cached in
// clients or bookmarks, so it keeps resolving to the same router.
router.use("/blogs",      journalRoutes);

export default router;
