import Booking from "../models/Booking.js";
import Business from "../models/Business.js";

/* ─────────────────────────────────────────────
   POST /api/bookings
   Guest or tourist creates a booking (no auth required)
───────────────────────────────────────────── */



export const createBooking = async (req, res) => {
  console.log("BOOKING REQ BODY:", req.body);
  try {
    const {
      businessId,
      bookingDate,
      timeSlot,
      guests,
      specialRequest,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;

    if (!businessId || !bookingDate || !timeSlot || !guests || !customerName || !customerEmail) {
      return res.status(400).json({
        message: "Name, email, businessId, bookingDate, timeSlot and guests are required.",
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    const booking = await Booking.create({
      user:           req.user?._id || null,
      business:       business._id,
      owner:          business.owner || null,
      bookingDate,
      timeSlot,
      guests:         parseInt(guests, 10),
      specialRequest: specialRequest || "",
      customerName,
      customerEmail,
      customerPhone:  customerPhone || "",
      status:         "pending",
      source:         "web",
    });

    await booking.populate("business", "name location images");

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

    if (booking.user?.toString() !== req.user._id.toString()) {
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
───────────────────────────────────────────── */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorised to cancel this booking." });
    }

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

    res.json({ success: true, message: "Booking cancelled successfully.", booking });
  } catch (error) {
    console.error("cancelBooking error:", error);
    res.status(500).json({ message: error.message });
  }
};