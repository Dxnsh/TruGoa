import Business from "../models/Business.js";
import Booking  from "../models/Booking.js";

/* ─────────────────────────────────────────────
   GET /api/owner/dashboard
   Stats overview for the logged-in owner
───────────────────────────────────────────── */
export const getDashboard = async (req, res) => {
  try {
    const ownerId = req.ownerId;

    const [businesses, bookings] = await Promise.all([
      Business.find({ owner: ownerId }),
      Booking.find({ owner: ownerId }),
    ]);

    const totalListings  = businesses.length;
    const approved       = businesses.filter(b => b.status === "approved").length;
    const pending        = businesses.filter(b => b.status === "pending").length;

    const totalBookings  = bookings.length;
    const newBookings    = bookings.filter(b => b.status === "pending").length;
    const confirmed      = bookings.filter(b => b.status === "confirmed").length;
    const totalGuests    = bookings
      .filter(b => b.status !== "cancelled" && b.status !== "rejected")
      .reduce((sum, b) => sum + (b.guests || 0), 0);

    // Revenue placeholder — sum of booking amounts
    const revenue = bookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    res.json({
      success: true,
      stats: {
        totalListings,
        approved,
        pending,
        totalBookings,
        newBookings,
        confirmed,
        totalGuests,
        revenue,
      },
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET /api/owner/businesses
   All listings belonging to this owner
───────────────────────────────────────────── */
export const getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.ownerId })
      .sort({ createdAt: -1 });

    res.json({ success: true, businesses });
  } catch (error) {
    console.error("getMyBusinesses error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET /api/owner/bookings
   All bookings for this owner's businesses
───────────────────────────────────────────── */
export const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { owner: req.ownerId };
    if (status && status !== "all") query.status = status;

    const bookings = await Booking.find(query)
      .populate("business", "name location images category")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("getMyBookings error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   PATCH /api/owner/bookings/:id/status
   Owner confirms or rejects a booking
───────────────────────────────────────────── */
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, internalNote } = req.body;

    const allowed = ["confirmed", "rejected", "completed", "no_show"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${allowed.join(", ")}`,
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("business", "owner");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Only the business owner can update
    if (booking.business?.owner?.toString() !== req.ownerId) {
      return res.status(403).json({ message: "Not authorised." });
    }

    booking.status = status;
    if (internalNote) booking.internalNote = internalNote;
    if (status === "rejected") {
      booking.cancelledBy     = "owner";
      booking.cancelledReason = internalNote || "Rejected by owner";
    }
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};