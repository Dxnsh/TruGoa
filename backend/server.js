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
import { isDevelopment, nodeEnv }             from "./config/env.js";
import { assertRequiredEnv }                  from "./config/requiredEnv.js";
import trendingRoutes from "./routes/trendingRoutes.js";
dotenv.config();

// NODE_ENV decides HTTPS enforcement, CORS origins, error-detail leakage and
// whether unapproved listings are public. The defaults now fail safe, so an
// unset variable is not dangerous — but it is almost always a misconfigured
// host, and it silently costs the local conveniences, so say so at boot.
if (!process.env.NODE_ENV) {
  logger.warn(
    "NODE_ENV is not set — running with production defaults (HTTPS enforced, " +
    "strict CORS, error details hidden, only approved listings public). Set it " +
    "to \"production\" on the host, or \"development\" locally, to be explicit."
  );
}

// Fail-fast on any required variable (MONGO_URI and the three JWT secrets):
// missing one of these otherwise surfaces as a bare 500 or an opaque driver
// error on the first request that needs it, with nothing pointing at the cause.
// Optional integrations (Cloudinary, Groq, Google) are only reported here, not
// enforced — each has a guarded degraded mode. See config/requiredEnv.js.
assertRequiredEnv();

const app = express();

// ── TRUST PROXY ───────────────────────────────────────────────────────────────
// Render terminates TLS and forwards HTTP at a single edge load balancer, so
// from this process there is exactly ONE trusted proxy hop. That hop appends the
// real client IP as the right-most X-Forwarded-For entry; "1" tells Express to
// take it for req.ip / req.secure — which is also the key express-rate-limit
// buckets each caller on.
//
//   1     → Render as deployed today (correct default)
//   2     → only if you later put Cloudflare (or another proxy) IN FRONT of Render
//   true  → NEVER: trusts the whole X-Forwarded-For chain, so any client can
//           spoof the header and mint unlimited fresh rate-limit buckets
//           (express-rate-limit also rejects this with ERR_ERL_PERMISSIVE_TRUST_PROXY)
//   false → NEVER on Render: req.ip becomes the LB's internal IP, identical for
//           every request, so all users share a single rate-limit bucket
//
// Overridable via TRUST_PROXY_HOPS so a future topology change is a dashboard
// edit rather than a deploy. A non-integer or negative value falls back to 1.
const parsedTrustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? "", 10);
const trustProxyHops =
  Number.isInteger(parsedTrustProxyHops) && parsedTrustProxyHops >= 0 ? parsedTrustProxyHops : 1;
app.set("trust proxy", trustProxyHops);
logger.info(`trust proxy = ${trustProxyHops} hop(s) — req.ip is taken ${trustProxyHops} entr${trustProxyHops === 1 ? "y" : "ies"} in from the right of X-Forwarded-For`);

// ── 0. HTTPS ENFORCEMENT ──────────────────────────────────────────────────────
// No-op in development. Everywhere else, redirect any request that didn't
// arrive over HTTPS (checked via X-Forwarded-Proto, set by the proxy/PaaS
// terminating TLS). Keyed on isDevelopment rather than === "production", so
// an unset NODE_ENV still enforces TLS instead of quietly serving plaintext.
if (!isDevelopment) {
  app.use((req, res, next) => {
    if (req.secure || req.headers["x-forwarded-proto"] === "https") return next();
    res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// ── 1. LOGGING ────────────────────────────────────────────────────────────────
app.use(morgan(isDevelopment ? "dev" : "combined", { stream: morganStream }));

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
  if (!isDevelopment) return false;
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
    // Reported so a deployment can be checked without shell access — an
    // "unset" here means the host is not setting NODE_ENV at all.
    nodeEnv,
    // Which cluster.js worker answered. Hitting /health a few times and seeing
    // more than one value confirms the process is actually clustered — which is
    // what makes the shared rate-limit store (rateLimitStore.js) necessary.
    pid:       process.pid,
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
app.use("/api/v1/trending", trendingRoutes);
app.use("/api/v1", apiRouter);

// ── 10. ERROR HANDLERS (must be last) ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── 11. START ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
let server;

// Mongo has to be connected before the port is opened. When app.listen() ran
// unawaited alongside connectDB(), the worker accepted requests during the
// connection window — Mongoose's command buffering hid that most of the time,
// but a slow connect surfaced it as raw driver errors instead of a clean
// startup delay. Awaiting here means the process is either not listening yet
// or fully ready.
const start = async () => {
  await connectDB();
  // Seeds the first owner from ADMIN_EMAIL / ADMIN_PASSWORD_HASH when no admin
  // accounts exist yet, so switching logins to the database can't lock everyone out.
  await bootstrapAdmin();

  server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Guard against slow-loris style connection exhaustion: cap how long a
  // client can take to finish sending headers/body before we drop it.
  server.headersTimeout = 15000;
  server.requestTimeout = 20000;
  // Keep-alive must stay below headersTimeout or a legitimate reused
  // connection can get cut off mid-request.
  server.keepAliveTimeout = 10000;
};

start();

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} — shutting down`);
  const closeDb = () => mongoose.connection.close(false).then(() => process.exit(0));
  if (server) {
    server.close(closeDb);
    setTimeout(() => process.exit(1), 10000);
  } else {
    closeDb();
  }
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

// An uncaught exception outside a request used to kill the worker with no log
// line explaining why. Log it, then exit deliberately: the process state is
// indeterminate after one of these, and cluster.js forks a replacement on
// exit, so a clean restart beats serving from a broken worker.
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception — exiting:", err);
  process.exit(1);
});
