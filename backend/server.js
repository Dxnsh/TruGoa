import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";        // ← ADD
import morgan from "morgan";                  // ← ADD
import mongoSanitize from "express-mongo-sanitize"; // ← ADD
import xss from "xss-clean";                  // ← ADD
import connectDB from "./config/db.js";
import { apiLimiter, authLimiter, aiLimiter, bookingLimiter } from "./middleware/rateLimiter.js"; // ← ADD
import { notFound, errorHandler } from "./middleware/errorHandler.js"; // ← ADD
import { responseTime } from "./middleware/timing.js"; // ← ADD

// route imports (all your existing ones stay)
import businessRoutes from "./routes/businessRoutes.js";
import reviewRoutes   from "./routes/reviewRoutes.js";
import aiRoutes       from "./routes/aiRoutes.js";
import authRoutes     from "./routes/authRoutes.js";
import adminRoutes    from "./routes/adminRoutes.js";
import touristRoutes  from "./routes/touristRoutes.js";
import bookingRoutes  from "./routes/bookingRoutes.js";
import ownerRoutes    from "./routes/ownerRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ── 1. LOGGING (first so every request is logged)
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
if (process.env.NODE_ENV === "production")  app.use(morgan("combined"));

// ── 2. SECURITY HEADERS
app.use(helmet({ crossOriginOpenerPolicy: false }));

// ── 3. CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://trugoa.com",
  "https://www.trugoa.com",
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── 4. COMPRESSION (before routes, after cors)
app.use(compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
  level: 6,
}));

// ── 5. BODY PARSING (with size limits)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── 6. SANITIZATION (after body parsing, before routes)
// app.use(mongoSanitize({
//   replaceWith: "_"
// }));
// app.use(xss());

// ── 7. TIMING
app.use(responseTime);

// ── 8. RATE LIMITERS (before routes)
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/tourist/google", authLimiter);
app.use("/api/ai/chat", aiLimiter);
app.use("/api/bookings", bookingLimiter);

// ── 9. HEALTH CHECK
app.get("/health", (req, res) => {
  const dbState = ["disconnected","connected","connecting","disconnecting"];
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    db: dbState[mongoose.connection.readyState],
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    timestamp: new Date().toISOString(),
  });
});

// ── 10. ROUTES (all your existing routes)
app.use("/api/businesses", businessRoutes);
app.use("/api/reviews",    reviewRoutes);
app.use("/api/ai",         aiRoutes);
app.use("/api/auth",       authRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/tourist",    touristRoutes);
app.use("/api/bookings",   bookingRoutes);
app.use("/api/owner",      ownerRoutes);

// ── 11. ERROR HANDLERS (must be LAST, after all routes)
app.use(notFound);
app.use(errorHandler);

// ── 12. START SERVER
const server = app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} — shutting down`);
  server.close(() => {
   mongoose.connection.close(false)
    .then(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  });
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});