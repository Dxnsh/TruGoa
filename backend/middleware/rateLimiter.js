// middleware/rateLimiter.js
import rateLimit from "express-rate-limit";
import { createMongoStore } from "./rateLimitStore.js";

const msg = (message) => ({ success: false, message });

// Every limiter uses the shared MongoDB store (see rateLimitStore.js) so its
// count is enforced across all cluster.js worker processes, not per-process.
// Each gets its own store instance with a distinct name so they count
// independently against the one `ratelimits` collection.

// Burst limiter — blunts rapid-fire request floods (script/bot hammering)
// within a short window, ahead of the longer 15-min window below.
export const burstLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore("burst"),
  message: msg("Too many requests in a short time. Slow down and try again."),
});

// Health check — cheap, but still worth capping so it can't be used to
// keep hammering the process even after the main API limiter kicks in.
export const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore("health"),
  message: msg("Too many requests."),
});

// General API limit — 100 requests per 15 min per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore("api"),
  message: msg("Too many requests. Please try again in 15 minutes."),
});

// Auth routes — stricter (5 login attempts per hour)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: createMongoStore("auth"),
  message: msg("Too many login attempts. Try again in an hour."),
  skipSuccessfulRequests: true,  // only counts failed attempts
});

// Admin login — same brute-force protection as owner login
export const adminLoginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: createMongoStore("admin-login"),
  message: msg("Too many login attempts. Try again in an hour."),
  skipSuccessfulRequests: true,
});

// AI chat — expensive, limit to 20 per hour per IP
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  store: createMongoStore("ai"),
  message: msg("AI rate limit reached. Try again in an hour."),
});

// Review submission — 10 per hour per IP, prevents review-bombing
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: createMongoStore("review"),
  message: msg("Review limit reached. Try again in an hour."),
});

// Contact form — 5 per hour per IP. A public, unauthenticated write, so it
// gets the same shape of protection as review submission; the cap is lower
// because nobody has five genuine enquiries in an hour.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: createMongoStore("contact"),
  message: msg("You've sent several messages already. Try again in an hour, or email us directly."),
});

// Itinerary generation — hits an external LLM, keep it tighter than
// the blanket apiLimiter so one visitor can't burn through the AI budget
export const itineraryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  store: createMongoStore("itinerary"),
  message: msg("Itinerary generation limit reached. Try again in an hour."),
});
