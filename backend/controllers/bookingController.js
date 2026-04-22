import Booking from "../models/Booking.js";
import Business from "../models/Business.js";

/* ─────────────────────────────────────────────
   POST /api/bookings
   Tourist creates a new booking request
───────────────────────────────────────────── */
export const createBooking = async (req, res) => {
  try {
    const { businessId, bookingDate, timeSlot, guests, specialRequest } = req.body;

    // Validate required fields
    if (!businessId || !bookingDate || !timeSlot || !guests) {
      return res.status(400).json({
        message: "businessId, bookingDate, timeSlot and guests are required.",
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    const booking = await Booking.create({
      user:    req.user._id,
      business: business._id,
      owner:   business.owner,

      bookingDate,
      timeSlot,
      guests,
      specialRequest: specialRequest || "",

      // Snapshot tourist contact at booking time
      customerName:  req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone || "",

      status:        "pending",
      paymentStatus: "unpaid",
      source:        "web",
    });

    // Populate for rich response
    await booking.populate("business", "name location images category");

    res.status(201).json({
      success: true,
      message: "Booking request sent successfully.",
      booking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET /api/bookings/my
   Tourist fetches their own booking history
───────────────────────────────────────────── */
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("business", "name location images category rating")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("getMyBookings error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET /api/bookings/:id
   Tourist fetches a single booking (must own it)
───────────────────────────────────────────── */
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("business", "name location images category rating contact");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Only the booking owner can view it
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorised to view this booking." });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("getBookingById error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   PATCH /api/bookings/:id/cancel
   Tourist cancels their own booking
   Only allowed when status is pending or confirmed
───────────────────────────────────────────── */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Ownership check
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorised to cancel this booking." });
    }

    // Can only cancel if pending or confirmed
    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot cancel a booking with status '${booking.status}'.`,
      });
    }

    booking.status          = "cancelled";
    booking.cancelledBy     = "user";
    booking.cancelledReason = req.body.reason || "Cancelled by tourist";
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    res.status(500).json({ message: error.message });
  }
};