import { theme } from "../../Theme";
import { adminCreateBusiness, adminUpdateBusiness,
        adminCreateTrendingPlace, adminUpdateTrendingPlace
 } from "../../services/api";



export const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: `1.5px solid ${theme.colors.borderLight}`,
  borderRadius: theme.radii.md, fontSize: 14,
  fontFamily: theme.typography.fontBody,
  color: theme.colors.textPrimary,
  background: "white",
};

export const labelStyle = {
  display: "block", fontSize: 12, fontWeight: theme.typography.weightBold,
  color: theme.colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em",
};

export const toList  = (str) => str.split(",").map(s => s.trim()).filter(Boolean);
export const toLines = (str) => str.split("\n").map(s => s.trim()).filter(Boolean);

export const saveBusiness = (business, payload) =>
  business?._id ? adminUpdateBusiness(business._id, payload) : adminCreateBusiness(payload);

export const saveTrendingPlace = (trendingItem, payload) =>
  trendingItem?._id
    ? adminUpdateTrendingPlace(trendingItem._id, payload)
    : adminCreateTrendingPlace(payload);

// ── MAP PIN ───────────────────────────────────────────────────────────────────
// Coordinates are what put a listing on the "near me" deck: without them the
// place has no `geo` point, so it can never match a proximity search however
// well the rest of the record is filled in.
//
// Asking an admin for two decimal numbers invites transposed digits, so this
// takes whatever comes off Google Maps instead — the address bar, a share
// link, or a copied "15.5439, 73.7553" — and pulls the pair out of it.
//
// The hard part is that a Maps URL routinely carries several coordinate pairs
// and they mean different things. Getting it wrong is worse than getting
// nothing: a silently misplaced pin puts the listing on someone's "near me"
// deck from tens of kilometres away, and nothing about the record looks wrong.
// So the rules below are ordered by how directly each pair names the place,
// and the vaguest of them is dropped entirely where it's known to mislead.
const NUM = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

const PIN_RULES = [
  // A /maps/place/ URL: the pinned place itself.
  { pattern: `!3d${NUM}!4d${NUM}`, lat: 1, lng: 2 },

  // Directions waypoints, one per stop, encoded longitude-first. The last one
  // is the destination — in a link to a place, that's the place. Earlier
  // matches are wherever the route happened to start from.
  { pattern: `!1d${NUM}!2d${NUM}`, lat: 2, lng: 1, useLast: true },

  // A directions link addressed by coordinates: /maps/dir//15.5451,73.8040/...
  { pattern: `/dir/+${NUM},${NUM}`, lat: 1, lng: 2 },

  { pattern: `[?&](?:q|ll|daddr|destination)=${NUM}(?:,|%2C)\\s*${NUM}`, lat: 1, lng: 2, flags: "i" },

  // A bare pasted pair.
  { pattern: `^${NUM}\\s*[,\\s]\\s*${NUM}$`, lat: 1, lng: 2 },

  // The map camera — only ever where the view was centred, not what was
  // pinned. It's a fair guess in a /maps/place/ link, where the view is on the
  // place. In a directions link it's centred to frame the whole route, which
  // puts it between the stops and belonging to neither, so it's refused there
  // rather than quietly producing a pin nobody asked for.
  { pattern: `@${NUM},${NUM}`, lat: 1, lng: 2, notOnDirections: true },
];

const COMPILED = PIN_RULES.map((rule) => ({
  ...rule,
  re: new RegExp(rule.pattern, rule.useLast ? `${rule.flags || ""}g` : rule.flags),
}));

// Google's own "copy coordinates" gives decimals, but the ones people read off
// a map listing or Wikipedia are degrees/minutes/seconds — 15°36′22″N
// 73°44′25″E. Same place, unusable as-is.
const DMS_PART = /(\d{1,3})\s*°\s*(\d{1,2})\s*[′'’]\s*([\d.]+)\s*[″"”]?\s*([NSEW])/gi;

const parseDms = (raw) => {
  const parts = [...raw.matchAll(DMS_PART)];
  if (parts.length !== 2) return null;

  const decimals = {};
  for (const [, deg, min, sec, hemisphere] of parts) {
    const value = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
    const letter = hemisphere.toUpperCase();
    decimals[letter] = letter === "S" || letter === "W" ? -value : value;
  }

  const lat = decimals.N ?? decimals.S;
  const lng = decimals.E ?? decimals.W;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const isPlausible = ({ lat, lng }) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const isDirectionsUrl = (raw) => /\/(?:maps\/)?dir\//i.test(raw);

export const parseCoordinates = (text) => {
  const raw = String(text || "").trim();
  if (!raw) return null;

  const dms = parseDms(raw);
  if (dms && isPlausible(dms)) return dms;

  const directions = isDirectionsUrl(raw);

  for (const rule of COMPILED) {
    if (rule.notOnDirections && directions) continue;

    let match;
    if (rule.useLast) {
      const all = [...raw.matchAll(rule.re)];
      match = all.length ? all[all.length - 1] : null;
    } else {
      match = raw.match(rule.re);
    }
    if (!match) continue;

    const found = { lat: Number(match[rule.lat]), lng: Number(match[rule.lng]) };
    if (isPlausible(found)) return found;
  }
  return null;
};

// Short links hold no coordinates at all — the pair only exists after the
// redirect — so they need opening before the URL is worth pasting. Worth
// naming separately, since "couldn't find a pin in that" is unhelpful advice
// when the fix is one specific step.
export const isShortMapLink = (text) => /goo\.gl|maps\.app|bit\.ly/i.test(String(text || ""));

// Goa's rough bounding box, mirroring the one the nearby endpoint checks
// against. A pin outside it is nearly always a lat/lng swap or a link copied
// from the wrong tab. It's a guess, not a rule, so the form warns rather than
// refuses — there's no reason a legitimate pin can't sit just over the border.
export const isInGoa = ({ lat, lng }) =>
  lat >= 14.85 && lat <= 15.85 && lng >= 73.6 && lng <= 74.35;

export const formatCoordinates = (lat, lng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;