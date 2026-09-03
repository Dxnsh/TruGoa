import { logger } from "../utils/logger.js";

// Fail-fast environment validation, called once from server.js start() before
// the DB connection is attempted.
//
// The rule: a variable is REQUIRED only if the process cannot serve requests
// correctly without it. Missing one of those is a deploy misconfiguration, so we
// log exactly what is missing and why, then exit — rather than booting and
// 500-ing on the first request that needs it (which is how these currently
// surface: a bare "secretOrPrivateKey must have a value" or a generic Mongoose
// parse error with nothing pointing at the real cause).
//
// Optional integrations are listed separately: their absence is a supported,
// guarded, degraded mode — but it is almost always unintended in production, so
// the boot log says which features are running without credentials.

const REQUIRED = [
  {
    key: "MONGO_URI",
    why: "MongoDB connection string — the database is unreachable without it and every route fails",
  },
  {
    key: "ADMIN_JWT_SECRET",
    why: "signs dashboard (admin) sessions — admin login returns a 500 without it",
  },
  {
    key: "TOURIST_JWT_SECRET",
    why: "signs tourist sessions — Google sign-in and saving an itinerary return a 500 without it",
  },
  {
    key: "JWT_SECRET",
    why: "signs owner-account sessions — POST /auth/register and /auth/login return a 500 without it",
  },
];

const OPTIONAL = [
  { key: "CLOUDINARY_CLOUD_NAME", feature: "image uploads (admin dashboard)" },
  { key: "CLOUDINARY_API_KEY", feature: "image uploads (admin dashboard)" },
  { key: "CLOUDINARY_API_SECRET", feature: "image uploads (admin dashboard)" },
  { key: "GROQ_API_KEY", feature: "AI guide chat, and AI itineraries (itinerary falls back to the local generator)" },
  { key: "GOOGLE_CLIENT_ID", feature: "tourist Google sign-in" },
];

const SECRET_KEYS = ["ADMIN_JWT_SECRET", "TOURIST_JWT_SECRET", "JWT_SECRET"];

const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";

export const assertRequiredEnv = () => {
  const missing = REQUIRED.filter(({ key }) => isBlank(process.env[key]));

  if (missing.length > 0) {
    logger.error(
      "Refusing to start — required environment variable(s) missing or blank:\n" +
        missing.map(({ key, why }) => `  - ${key}: ${why}`).join("\n") +
        "\nSet them on the host (Render -> your service -> Environment) and redeploy. " +
        "See backend/.env.example and docs/ENV_CHECKLIST.md."
    );
    process.exit(1);
  }

  // Weak or placeholder secrets still work, they are just guessable — warn, do
  // not block, so a deploy is never held hostage to a policy check.
  for (const key of SECRET_KEYS) {
    if (String(process.env[key]).trim().length < 16) {
      logger.warn(
        `${key} is shorter than 16 characters — use a long random value, e.g. \`openssl rand -base64 48\`.`
      );
    }
  }

  // Three separate secrets exist so a leak of one audience's token can't be
  // replayed against another. Sharing a value defeats that.
  const secretValues = SECRET_KEYS.map((k) => String(process.env[k]));
  if (new Set(secretValues).size < secretValues.length) {
    logger.warn(
      "Two or more of ADMIN_JWT_SECRET / TOURIST_JWT_SECRET / JWT_SECRET share the same value — give each its own."
    );
  }

  const offline = OPTIONAL.filter(({ key }) => isBlank(process.env[key]));
  if (offline.length > 0) {
    const features = [...new Set(offline.map((o) => o.feature))];
    logger.warn(
      "Optional integrations not configured — these features run degraded:\n" +
        features.map((f) => `  - ${f}`).join("\n")
    );
  }

  logger.info("Environment check passed — all required variables are set.");
};
