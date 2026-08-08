import express from "express";

import businessRoutes  from "./businessRoutes.js";
import adminRoutes     from "./adminRoutes.js";
import authRoutes      from "./authRoutes.js";
import aiRoutes        from "./aiRoutes.js";
import itineraryRoutes from "./itineraryRoutes.js";
import touristRoutes   from "./touristRoutes.js";
import storyRoutes     from "./storyRoutes.js";
import reviewRoutes    from "./reviewRoutes.js";

const router = express.Router();

router.use("/businesses", businessRoutes);
router.use("/admin",      adminRoutes);
router.use("/auth",       authRoutes);
router.use("/ai",         aiRoutes);
router.use("/itinerary",  itineraryRoutes);
router.use("/tourist",    touristRoutes);
router.use("/stories",    storyRoutes);
router.use("/reviews",    reviewRoutes);

export default router;
