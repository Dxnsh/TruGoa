// middleware/timing.js
import { logger } from "../utils/logger.js";

export const responseTime = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (ms > 1000) {
      // Log slow requests (over 1 second)
      logger.warn(`SLOW REQUEST: ${req.method} ${req.url} — ${ms}ms`);
    }
  });
  next();
};