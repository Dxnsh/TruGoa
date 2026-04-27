// middleware/cacheMiddleware.js
import { cache } from "../config/cache.js";

export const cacheResponse = (ttlSeconds = 300) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== "GET") return next();

  const key = `cache:${req.originalUrl}`;
  const cached = cache.get(key);

  if (cached) {
    return res.json(cached);
  }

  // Intercept res.json to cache before sending
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    cache.set(key, data, ttlSeconds);
    return originalJson(data);
  };

  next();
};

// Clear cache for a route pattern (call after write operations)
export const clearCache = (pattern) => {
  const keys = cache.keys().filter(k => k.includes(pattern));
  keys.forEach(k => cache.del(k));
};