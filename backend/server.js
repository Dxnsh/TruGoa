import express    from "express";
import dotenv     from "dotenv";
import mongoose   from "mongoose";
import cors       from "cors";
import helmet     from "helmet";
import compression from "compression";
import morgan     from "morgan";

import connectDB     from "./config/db.js";
import { apiLimiter, authLimiter, aiLimiter, burstLimiter, healthLimiter } from "./middleware/rateLimiter.js";
import { notFound, errorHandler }             from "./middleware/errorHandler.js";
import { responseTime }                       from "./middleware/timing.js";
import { sanitizeInput }                      from "./middleware/sanitize.js";
import { logger, morganStream }               from "./utils/logger.js";
import apiRouter                              from "./routes/index.js";

dotenv.config();

connectDB();

const app = express();

// Correct req.ip / req.secure once behind a reverse proxy or PaaS load
// balancer (also required for express-rate-limit to key off the real
// client IP instead of the proxy's).
app.set("trust proxy", 1);

// ── 0. HTTPS ENFORCEMENT ──────────────────────────────────────────────────────
// No-op in development. In production, redirect any request that didn't
// arrive over HTTPS (checked via X-Forwarded-Proto, set by the proxy/PaaS
// terminating TLS).
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.secure || req.headers["x-forwarded-proto"] === "https") return next();
    res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// ── 1. LOGGING ────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined", { stream: morganStream }));

// ── 2. SECURITY HEADERS ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginOpenerPolicy: false }));

// ── 3. CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "https://trugoa.in",
  "https://www.trugoa.in",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── 4. COMPRESSION ────────────────────────────────────────────────────────────
app.use(compression({ level: 6 }));

// ── 5. BODY PARSING ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── 5b. SANITIZATION ──────────────────────────────────────────────────────────
// Strips $/. keys to block NoSQL operator injection — must run after body parsing.
app.use(sanitizeInput);

// ── 6. TIMING ─────────────────────────────────────────────────────────────────
app.use(responseTime);

// ── 7. RATE LIMITERS ──────────────────────────────────────────────────────────
app.use(burstLimiter);
app.use("/api/v1",        apiLimiter);
app.use("/api/v1/auth",   authLimiter);
app.use("/api/v1/ai",     aiLimiter);

// ── 8. HEALTH CHECK ───────────────────────────────────────────────────────────
app.get("/health", healthLimiter, (req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status:    "ok",
    uptime:    Math.floor(process.uptime()),
    db:        dbState[mongoose.connection.readyState],
    memory:    `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    timestamp: new Date().toISOString(),
  });
});

// ── 9. API (v1) ────────────────────────────────────────────────────────────────
app.use("/api/v1", apiRouter);

// ── 10. ERROR HANDLERS (must be last) ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── 11. START ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Guard against slow-loris style connection exhaustion: cap how long a
// client can take to finish sending headers/body before we drop it.
server.headersTimeout = 15000;
server.requestTimeout = 20000;
// Keep-alive must stay below headersTimeout or a legitimate reused
// connection can get cut off mid-request.
server.keepAliveTimeout = 10000;

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} — shutting down`);
  server.close(() => {
    mongoose.connection.close(false).then(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  });
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});
