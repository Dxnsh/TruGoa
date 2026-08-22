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
import { bootstrapAdmin }                     from "./utils/bootstrapAdmin.js";
import { isCloudinaryConfigured }             from "./config/cloudinary.js";

dotenv.config();

// Every admin session token is signed with this. Without it jwt.sign throws
// on an otherwise correct login, which surfaces as a bare 500 and looks like a
// server fault rather than a missing variable — so say so at boot instead.
if (!process.env.ADMIN_JWT_SECRET) {
  logger.error(
    "ADMIN_JWT_SECRET is not set — admin login will fail with a 500 even when " +
    "the email and password are correct. Set it and restart."
  );
}

// Seeds the first owner from ADMIN_EMAIL / ADMIN_PASSWORD_HASH when no admin
// accounts exist yet, so switching logins to the database can't lock everyone out.
connectDB().then(bootstrapAdmin);

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

// Vite picks the next free port (5174, 5175, …) whenever 5173 is already in
// use, which silently breaks every request with a CORS error. In development
// any localhost port is therefore accepted; production still matches the
// allowlist above exactly, so this never widens the deployed surface.
const isAllowedOrigin = (origin) => {
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== "development") return false;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── 4. COMPRESSION ────────────────────────────────────────────────────────────
app.use(compression({ level: 6 }));

// ── 5. BODY PARSING ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

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
    // Which optional integrations actually have credentials here. Booleans
    // only — never the values. Since .env is gitignored, a deployment's
    // variables are set by hand and there is otherwise no way to tell a
    // missing one from a broken feature: the request just 500s with its
    // message stripped. This turns that into one request.
    configured: {
      cloudinary: isCloudinaryConfigured,       // image uploads
      groq:       Boolean(process.env.GROQ_API_KEY),        // AI itineraries
      google:     Boolean(process.env.GOOGLE_CLIENT_ID),    // Google sign-in
    },
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
