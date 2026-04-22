import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protectTourist } from "../middleware/authMiddleware.js";

const router = express.Router();

// All booking routes require a logged-in tourist
router.use(protectTourist);

// POST   /api/bookings          → create a new booking
router.post("/", createBooking);

// GET    /api/bookings/my       → get all bookings for current tourist
// NOTE: /my must be declared BEFORE /:id so Express doesn't treat "my" as an id
router.get("/my", getMyBookings);

// GET    /api/bookings/:id      → get single booking (owner only)
router.get("/:id", getBookingById);

// PATCH  /api/bookings/:id/cancel → tourist cancels booking
router.patch("/:id/cancel", cancelBooking);

export default router;