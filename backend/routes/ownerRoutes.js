import express from "express";
import {
  getDashboard,
  getMyBusinesses,
  getMyBookings,
  updateBookingStatus,
} from "../controllers/ownerController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// All owner routes require owner JWT (sets req.ownerId)
router.use(authMiddleware);

router.get("/dashboard",              getDashboard);
router.get("/businesses",             getMyBusinesses);
router.get("/bookings",               getMyBookings);
router.patch("/bookings/:id/status",  updateBookingStatus);

export default router;