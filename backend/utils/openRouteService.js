import { logger } from "./logger.js";

// Real driving distance/duration via OpenRouteService's Directions API — a
// paid-above-free-tier third party, so every call here is deliberate: the
// controller only reaches this once per detail-page view, never per card.
//
// Without ORS_API_KEY configured, or if ORS itself errors/rate-limits/times
// out, this resolves to null rather than throwing — the caller's contract is
// "best-effort real distance", with straight-line distance as the fallback
// the frontend already computes on its own.
//
// ORS enforces two independent limits and signals each differently: the
// per-minute burst limit (40/min on the free tier) comes back as 429 Too Many
// Requests, while the daily quota (2,000/day on the free tier) comes back as
// 403 Forbidden — being under one limit does not protect you from the other.
// `!res.ok` below is deliberately generic rather than special-cased per
// status: every non-2xx (429, 403, an expired/invalid key, a 5xx from ORS
// itself) means "no real distance right now", and all of them get the exact
// same fallback-to-straight-line treatment. The status is still logged
// per-case purely for diagnosis — never used to change the fallback logic.

const ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";

// A rough, in-memory approximation of the daily quota so it shows up in
// Render's logs without a dashboard visit. Deliberately approximate: it
// counts requests this process actually sent to ORS (not cache hits), reset
// at UTC midnight, and per-process — cluster.js forks more than one worker,
// each keeping its own count, so the real total is the sum across workers on
// a multi-worker deploy. Good enough to watch how close to the ceiling a
// single day is running; not a substitute for ORS's own dashboard.
const DAILY_LIMIT_HINT = 2000;
let dailyCount = 0;
let dailyCountDay = new Date().toISOString().slice(0, 10);

const trackDailyUsage = () => {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyCountDay) {
    dailyCountDay = today;
    dailyCount = 0;
  }
  dailyCount += 1;

  if (dailyCount === DAILY_LIMIT_HINT) {
    logger.warn(`OpenRouteService: ~${dailyCount} requests sent today (this process) — at the free-tier daily ceiling.`);
  } else if (dailyCount % 100 === 0 || dailyCount === Math.round(DAILY_LIMIT_HINT * 0.9)) {
    logger.info(`OpenRouteService: ~${dailyCount}/${DAILY_LIMIT_HINT} requests sent today (this process).`);
  }
};

// Rounded to ~1 decimal metre (5 dp) so repeated requests for the same
// origin/destination pair — the common case, since a business's coordinates
// never move and a visitor doesn't either while browsing — hit the cache
// instead of spending ORS quota again.
const ROUND_DP = 5;
const round = (n) => Number(n.toFixed(ROUND_DP));
const cacheKey = (origin, destination) =>
  `${round(origin.lat)},${round(origin.lng)}|${round(destination.lat)},${round(destination.lng)}`;

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();

const getCached = (key) => {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
};

const setCached = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const REQUEST_TIMEOUT_MS = 5000;

/**
 * origin/destination: { lat, lng } in degrees.
 * Resolves to { distanceMeters, durationSeconds }, or null if the real
 * distance couldn't be obtained for any reason (missing key, ORS down,
 * rate-limited, malformed response, timeout).
 */
export const getDrivingDistance = async (origin, destination) => {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return null;

  // Guards non-numeric input (e.g. an un-coerced query-string value slipping
  // through from a caller) the same way a network failure is guarded below —
  // this function's whole contract is "never throws, worst case null", so a
  // malformed coordinate must degrade exactly like a rate limit does, not
  // bubble up as an unhandled exception that turns into a 500.
  if (![origin.lat, origin.lng, destination.lat, destination.lng].every(Number.isFinite)) {
    return null;
  }

  const key = cacheKey(origin, destination);
  const cached = getCached(key);
  if (cached !== undefined) return cached;

  const params = new URLSearchParams({
    api_key: apiKey,
    start: `${origin.lng},${origin.lat}`,
    end: `${destination.lng},${destination.lat}`,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${ORS_DIRECTIONS_URL}?${params.toString()}`, {
      signal: controller.signal,
    });
    trackDailyUsage();

    if (!res.ok) {
      // 429 = per-minute burst limit; 403 = daily quota exhausted (or a bad
      // key — ORS uses the same status for both). Logged only to tell the
      // two apart in Render's logs; both fall back identically either way.
      if (res.status === 429) {
        logger.warn("OpenRouteService: 429 — per-minute rate limit hit. Falling back to straight-line distance.");
      } else if (res.status === 403) {
        logger.warn("OpenRouteService: 403 — daily quota exhausted, or ORS_API_KEY is invalid/revoked. Falling back to straight-line distance.");
      } else {
        logger.warn(`OpenRouteService: request failed with ${res.status}. Falling back to straight-line distance.`);
      }
      return null;
    }

    const body = await res.json();
    const summary = body?.features?.[0]?.properties?.summary;
    if (typeof summary?.distance !== "number" || typeof summary?.duration !== "number") {
      return null;
    }

    const result = { distanceMeters: summary.distance, durationSeconds: summary.duration };
    setCached(key, result);
    return result;
  } catch {
    // Network error, timeout/abort, or bad JSON — all equally "not available".
    return null;
  } finally {
    clearTimeout(timer);
  }
};
