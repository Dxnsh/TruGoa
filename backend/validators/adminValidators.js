import { body, param } from "express-validator";

const BUSINESS_CATEGORIES = [
  "restaurant",
  "cafe",
  "hotel",
  "stay",
  "beach",
  "activity",
  "market",
  "heritage",
  "nightlife",
  "spiritual",
  "art-gallery",
  "museum",
  "library",
];
const BUSINESS_AREAS = ["north-goa", "south-goa", "panaji", "central-goa"];
const PRICE_LEVELS = ["budget", "mid", "premium"];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const HOURS_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Shape-check the structured hours object. The controller (cleanOpeningHours)
// still normalises whatever gets through — blank/half-filled periods are
// dropped — so this only rejects what normalisation can't rescue: a non-object
// payload, or a time string that isn't HH:MM at all.
const timeOk = (t) => t === undefined || t === "" || HHMM.test(t);
const isValidOpeningHours = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  for (const day of HOURS_DAYS) {
    const entry = value[day];
    if (entry === undefined || entry === null) continue;
    if (typeof entry !== "object" || Array.isArray(entry)) return false;
    if (!timeOk(entry.open) || !timeOk(entry.close)) return false;
    if (entry.periods !== undefined) {
      if (!Array.isArray(entry.periods)) return false;
      for (const p of entry.periods) {
        if (!p || typeof p !== "object") return false;
        if (!timeOk(p.open) || !timeOk(p.close)) return false;
      }
    }
  }
  return true;
};

const openingHoursRule = body("openingHours")
  .optional({ values: "null" })
  .custom(isValidOpeningHours)
  .withMessage("openingHours must be a per-day object with HH:MM times");

export const adminLoginRules = [
  body("email").isString().trim().notEmpty().withMessage("Email is required"),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

export const createBusinessRules = [
  body("name").isString().trim().notEmpty().withMessage("Name is required"),
  body("location").isString().trim().notEmpty().withMessage("Location is required"),
  body("category").isString().trim().toLowerCase().isIn(BUSINESS_CATEGORIES).withMessage("Invalid category"),
  body("area").optional().isIn(BUSINESS_AREAS),
  body("priceLevel").optional().isIn(PRICE_LEVELS),
  body("latitude").optional({ values: "null" }).isFloat(),
  body("longitude").optional({ values: "null" }).isFloat(),
  body("highlights").optional().isArray(),
  body("mustTry").optional().isArray(),
  body("idealFor").optional().isArray(),
  body("gallery").optional().isArray(),
  body("tags").optional().isArray(),
  body("featured").optional().isBoolean(),
  body("editorPick").optional().isBoolean(),
  body("openingHoursNote").optional({ values: "null" }).isString().trim().isLength({ max: 300 }),
  openingHoursRule,
];

export const updateBusinessRules = [
  param("id").isMongoId().withMessage("Invalid business id"),
  body("name").optional().isString().trim().notEmpty(),
  body("location").optional().isString().trim().notEmpty(),
  body("category").optional().isString().trim().toLowerCase().isIn(BUSINESS_CATEGORIES).withMessage("Invalid category"),
  body("area").optional().isIn(BUSINESS_AREAS),
  body("priceLevel").optional().isIn(PRICE_LEVELS),
  body("latitude").optional({ values: "null" }).isFloat(),
  body("longitude").optional({ values: "null" }).isFloat(),
  body("openingHoursNote").optional({ values: "null" }).isString().trim().isLength({ max: 300 }),
  openingHoursRule,
];

export const businessIdParamRules = [
  param("id").isMongoId().withMessage("Invalid business id"),
];
