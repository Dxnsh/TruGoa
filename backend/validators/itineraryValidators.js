import { body } from "express-validator";

export const VALID_DURATIONS = ["2", "3", "5", "7", "10"];
export const VALID_BUDGETS = ["budget", "mid", "premium", "luxury"];
export const VALID_VIBES = ["beach", "heritage", "hidden", "party", "romantic", "adventure"];
export const VALID_STYLES = ["solo", "couple", "friends", "family"];

export const generateItineraryRules = [
  body("duration").customSanitizer((v) => String(v)).isIn(VALID_DURATIONS).withMessage("Invalid duration"),
  body("budget").isIn(VALID_BUDGETS).withMessage("Invalid budget"),
  body("vibe").isIn(VALID_VIBES).withMessage("Invalid vibe"),
  body("interests").isArray({ min: 1 }).withMessage("interests must be a non-empty array"),
  body("style").isIn(VALID_STYLES).withMessage("Invalid style"),
];

export const saveItineraryRules = [
  body("form").exists().withMessage("form is required"),
  body("data").exists().withMessage("data is required"),
];
