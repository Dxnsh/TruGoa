// Straight-line distance between two points, and how to write it down.
//
// Shared because two places need the same answer and must not disagree: the
// swipe deck recomputes a card's distance as the visitor moves, and a place's
// own page ranks what's near it. Mongo's $geoNear measures on the WGS84
// ellipsoid while this is a sphere, so the two differ by about 0.11% — 67 m
// over 60 km, half a metre over 400. Far below anything either caller prints.

const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Both points are { lat, lng } in degrees. Returns metres. */
export const metresBetween = (a, b) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
};

/**
 * The bare measurement — "340 m", "2.4 km" — with no preposition.
 * What it's measured *from* differs by caller (the reader, or a place they're
 * looking at), so the wording is left to them.
 */
export const formatDistance = (metres) => {
  if (typeof metres !== "number" || !Number.isFinite(metres)) return null;
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1)} km`;
};

/** True when a record carries a usable coordinate pair. */
export const hasCoordinates = (place) =>
  typeof place?.latitude === "number" && typeof place?.longitude === "number";

/** Convenience for the common shape: a business document → { lat, lng }. */
export const pointOf = (place) => ({ lat: place.latitude, lng: place.longitude });
