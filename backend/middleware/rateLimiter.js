// middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

const msg = (message) => ({ success: false, message });

// General API limit — 100 requests per 15 min per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many requests. Please try again in 15 minutes."),
});

// Auth routes — stricter (5 login attempts per hour)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: msg("Too many login attempts. Try again in an hour."),
  skipSuccessfulRequests: true,  // only counts failed attempts
});

// Admin login — same brute-force protection as owner login
export const adminLoginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: msg("Too many login attempts. Try again in an hour."),
  skipSuccessfulRequests: true,
});

// AI chat — expensive, limit to 20 per hour per IP
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: msg("AI rate limit reached. Try again in an hour."),
});

// Review submission — 10 per hour per IP, prevents review-bombing
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: msg("Review limit reached. Try again in an hour."),
});

// Itinerary generation — hits an external LLM, keep it tighter than
// the blanket apiLimiter so one visitor can't burn through the AI budget
export const itineraryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: msg("Itinerary generation limit reached. Try again in an hour."),
});
