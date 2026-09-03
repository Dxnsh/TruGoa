// middleware/rateLimitStore.js
//
// A MongoDB-backed store for express-rate-limit.
//
// cluster.js forks one worker per CPU core, and express-rate-limit's default
// MemoryStore lives inside a single process — so with N workers each limiter's
// effective ceiling was ~N times the configured number, and which worker
// answered decided whether you were counted. This store keeps the counters in
// MongoDB (the connection the app already holds — no new service, no new npm
// dependency), so all workers on the host share one count per client. It also
// works unchanged if the app is ever run on more than one host.
//
// One document per (limiter, client), a fixed-window counter that MongoDB's TTL
// index reaps once the window closes:
//
//   { _id: "<name>:<key>", count: <int>, expiresAt: <Date> }
//
// Fail-open: if MongoDB is unreachable the store logs (throttled) and reports a
// single hit, so a database blip degrades rate limiting instead of turning every
// request into a 500. When MongoDB is down every route is failing anyway.

import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

const COLLECTION = "ratelimits";

// The counter window is enforced in the query (expiresAt > now); the TTL index
// is only housekeeping so expired documents don't accumulate. expireAfterSeconds
// is 0 because the document itself carries the exact expiry time.
let indexPromise = null;
const ensureIndex = (collection) => {
  if (!indexPromise) {
    indexPromise = collection
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ratelimit_ttl" })
      .catch((err) => {
        indexPromise = null; // allow a later call to retry
        logger.warn(`rate-limit TTL index not created (documents will still expire logically): ${err.message}`);
      });
  }
  return indexPromise;
};

let lastWarnAt = 0;
const warnThrottled = (message) => {
  const now = Date.now();
  if (now - lastWarnAt > 30_000) {
    lastWarnAt = now;
    logger.warn(message);
  }
};

// One store instance per limiter. `name` namespaces the keys so every limiter
// counts independently against the same collection.
export const createMongoStore = (name) => {
  let windowMs = 60_000; // replaced by init() with the limiter's real window

  const collection = () => {
    if (mongoose.connection?.readyState !== 1) return null;
    return mongoose.connection.db.collection(COLLECTION);
  };
  const docId = (key) => `${name}:${key}`;

  // Increment an active window, or start a fresh one — in a single atomic
  // findOneAndUpdate so two workers hitting a new/expired key can't both reset it.
  const bumpPipeline = (now, fresh) => [
    {
      $set: {
        count: {
          $cond: [{ $gt: ["$expiresAt", now] }, { $add: [{ $ifNull: ["$count", 0] }, 1] }, 1],
        },
        expiresAt: {
          $cond: [{ $gt: ["$expiresAt", now] }, "$expiresAt", fresh],
        },
      },
    },
  ];

  return {
    // Tells express-rate-limit this store is shared (disables the MemoryStore
    // "you're behind a cluster" heuristics) and how keys are namespaced.
    localKeys: false,
    prefix: `${name}:`,

    init(options) {
      windowMs = options.windowMs;
    },

    async increment(key) {
      const c = collection();
      const now = new Date();
      const fresh = new Date(now.getTime() + windowMs);

      if (!c) {
        warnThrottled("rate-limit store: MongoDB not connected — allowing request (fail-open)");
        return { totalHits: 1, resetTime: fresh };
      }
      ensureIndex(c);

      const pipeline = bumpPipeline(now, fresh);
      try {
        const doc = await c.findOneAndUpdate({ _id: docId(key) }, pipeline, {
          upsert: true,
          returnDocument: "after",
        });
        return { totalHits: doc.count, resetTime: doc.expiresAt };
      } catch (err) {
        if (err?.code === 11000) {
          // Lost an insert race — the document exists now, retry as a plain update.
          const doc = await c.findOneAndUpdate({ _id: docId(key) }, pipeline, {
            returnDocument: "after",
          });
          return { totalHits: doc?.count ?? 1, resetTime: doc?.expiresAt ?? fresh };
        }
        warnThrottled(`rate-limit store increment failed (${err.message}) — allowing request`);
        return { totalHits: 1, resetTime: fresh };
      }
    },

    async decrement(key) {
      // Used by skipSuccessfulRequests / skipFailedRequests to hand a hit back.
      const c = collection();
      if (!c) return;
      try {
        await c.updateOne(
          { _id: docId(key), expiresAt: { $gt: new Date() }, count: { $gt: 0 } },
          { $inc: { count: -1 } }
        );
      } catch (err) {
        warnThrottled(`rate-limit store decrement failed: ${err.message}`);
      }
    },

    async resetKey(key) {
      const c = collection();
      if (!c) return;
      try {
        await c.deleteOne({ _id: docId(key) });
      } catch (err) {
        warnThrottled(`rate-limit store resetKey failed: ${err.message}`);
      }
    },

    async resetAll() {
      const c = collection();
      if (!c) return;
      try {
        await c.deleteMany({ _id: { $regex: `^${name}:` } });
      } catch (err) {
        warnThrottled(`rate-limit store resetAll failed: ${err.message}`);
      }
    },

    async get(key) {
      const c = collection();
      if (!c) return undefined;
      try {
        const doc = await c.findOne({ _id: docId(key) });
        if (!doc || doc.expiresAt <= new Date()) return undefined;
        return { totalHits: doc.count, resetTime: doc.expiresAt };
      } catch {
        return undefined;
      }
    },
  };
};
