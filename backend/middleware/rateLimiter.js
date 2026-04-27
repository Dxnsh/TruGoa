// middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

// General API limit — 100 requests per 15 min per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in 15 minutes." },
});

// Auth routes — stricter (5 login attempts per hour)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again in an hour." },
  skipSuccessfulRequests: true,  // only counts failed attempts
});

// AI chat — expensive, limit to 20 per hour per IP
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "AI rate limit reached. Try again in an hour." },
});

// Booking creation — 10 per hour
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Booking limit reached. Try again in an hour." },
});