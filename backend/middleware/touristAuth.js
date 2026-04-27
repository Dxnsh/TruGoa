import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protectTourist, optionalTourist } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST — optionalTourist links booking to account if logged in
// BUG FIX: was two router.post("/") lines — second one was never reached
router.post("/",            optionalTourist, createBooking);

// /my must be before /:id — otherwise "my" is treated as a mongo id
router.get("/my",           protectTourist,  getMyBookings);
router.get("/:id",          protectTourist,  getBookingById);
router.patch("/:id/cancel", protectTourist,  cancelBooking);

export default router;