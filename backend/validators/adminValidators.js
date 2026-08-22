import { body, param } from "express-validator";

const BUSINESS_CATEGORIES = [
  "restaurant", "cafe", "hotel", "stay", "beach",
  "activity", "market", "heritage", "nightlife", "spiritual",
];
const BUSINESS_AREAS = ["north-goa", "south-goa", "panaji", "central-goa"];
const PRICE_LEVELS = ["budget", "mid", "premium"];

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
  body("latitude").optional().isFloat(),
  body("longitude").optional().isFloat(),
  body("highlights").optional().isArray(),
  body("mustTry").optional().isArray(),
  body("idealFor").optional().isArray(),
  body("gallery").optional().isArray(),
  body("tags").optional().isArray(),
  body("featured").optional().isBoolean(),
  body("editorPick").optional().isBoolean(),
];

export const updateBusinessRules = [
  param("id").isMongoId().withMessage("Invalid business id"),
  body("name").optional().isString().trim().notEmpty(),
  body("location").optional().isString().trim().notEmpty(),
  body("category").optional().isString().trim().toLowerCase().isIn(BUSINESS_CATEGORIES).withMessage("Invalid category"),
  body("area").optional().isIn(BUSINESS_AREAS),
  body("priceLevel").optional().isIn(PRICE_LEVELS),
  body("latitude").optional().isFloat(),
  body("longitude").optional().isFloat(),
];

export const businessIdParamRules = [
  param("id").isMongoId().withMessage("Invalid business id"),
];
