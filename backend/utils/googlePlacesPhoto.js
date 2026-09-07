import { logger } from "./logger.js";

// Best-effort "photo of this actual place" via the Google Places API (New).
// Used only as a fallback in the itinerary generator, for a stop that has no
// photo from a matching TruGoa listing.
//
// Needs GOOGLE_PLACES_API_KEY (a Google Cloud key with the "Places API (New)"
// enabled and billing on the project). Without it — or on any error, timeout
// or rate-limit — this resolves to null and the caller keeps its category
// placeholder. Two billed calls per uncached place (Text Search + Photo), so
// results are cached hard by normalised query.
//
// The photo URL returned by `skipHttpRedirect=true` is a plain
// lh3.googleusercontent.com link with no key in it — safe to store on the
// itinerary and send to the browser. Google documents it as time-limited, so
// a long-saved itinerary may eventually 404 one; the frontend's onError drops
// back to the category image when that happens.

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const REQUEST_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // a place's photo doesn't change hourly
const MAX_WIDTH_PX = 1000;

const cache = new Map(); // key -> { value: string|null, expiresAt }

const keyFor = (query) => String(query).trim().toLowerCase().replace(/\s+/g, " ");

const getCached = (key) => {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
};

const withTimeout = async (url, options) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

/**
 * @param {string} query  e.g. "Chapora Fort, Bardez, Goa"
 * @param {{lat?:number,lng?:number}} [bias]  optional centre to bias the search
 * @returns {Promise<string|null>} a usable image URL, or null
 */
export const getPlacePhoto = async (query, bias) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !query) return null;

  const key = keyFor(query);
  const cached = getCached(key);
  if (cached !== undefined) return cached;

  const remember = (value) => {
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  };

  try {
    const body = { textQuery: query, maxResultCount: 1 };
    if (bias && Number.isFinite(bias.lat) && Number.isFinite(bias.lng)) {
      body.locationBias = {
        circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 30000 },
      };
    }

    const searchRes = await withTimeout(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.photos",
      },
      body: JSON.stringify(body),
    });

    if (!searchRes.ok) {
      logger.warn(`Google Places search failed (${searchRes.status}) for "${query}"`);
      return remember(null);
    }

    const search = await searchRes.json();
    const photoName = search?.places?.[0]?.photos?.[0]?.name;
    if (!photoName) return remember(null);

    const mediaRes = await withTimeout(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${MAX_WIDTH_PX}&skipHttpRedirect=true`,
      { headers: { "X-Goog-Api-Key": apiKey } }
    );
    if (!mediaRes.ok) {
      logger.warn(`Google Places photo media failed (${mediaRes.status}) for "${query}"`);
      return remember(null);
    }

    const media = await mediaRes.json();
    return remember(typeof media?.photoUri === "string" ? media.photoUri : null);
  } catch (err) {
    logger.warn(`Google Places photo lookup errored for "${query}": ${err.message}`);
    return remember(null);
  }
};
