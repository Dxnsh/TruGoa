// config/cache.js
import NodeCache from "node-cache";

// TTL = time to live in seconds
export const cache = new NodeCache({
  stdTTL: 300,           // 5 minutes default
  checkperiod: 60,       // check for expired keys every 60s
  maxKeys: 1000,         // max 1000 cached items
});