import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // Tourist who booked
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tourist",
      required: false,
      default: null,
      index: true,
    },

    // Business being booked
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    // Owner of business (fast querying dashboard)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: false,
      default: null,
      index: true,
    },

    // Booking Details
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },

    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },

    guests: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },

    specialRequest: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // Contact Snapshot (safe if user changes later)
    customerName: String,
    customerEmail: String,
    customerPhone: String,

    // Status Lifecycle
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
        "no_show"
      ],
      default: "pending",
      index: true,
    },

    // Optional payment ready later
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    amount: {
      type: Number,
      default: 0,
    },

    // Notes by owner/admin
    internalNote: {
      type: String,
      default: "",
    },

    // Tracking
    source: {
      type: String,
      enum: ["web", "mobile", "admin"],
      default: "web",
    },

    cancelledBy: {
      type: String,
      enum: ["user", "owner", "admin", null],
      default: null,
    },

    cancelledReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ business: 1, bookingDate: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ user: 1, createdAt: -1 }, { sparse: true });

export default mongoose.model("Booking", bookingSchema);