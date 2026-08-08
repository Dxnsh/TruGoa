import { query, param } from "express-validator";

export const listBusinessesRules = [
  query("category").optional().isString().trim().isLength({ max: 50 }),
  query("area").optional().isIn(["north-goa", "south-goa", "panaji", "central-goa"]),
  query("priceLevel").optional().isIn(["budget", "mid", "premium"]),
  query("featured").optional().isBoolean().toBoolean(),
  query("search").optional().isString().trim().isLength({ max: 100 }),
];

export const businessIdParamRules = [
  param("id").isMongoId().withMessage("Invalid business id"),
];

export const businessSlugParamRules = [
  param("slug").isString().trim().notEmpty(),
];
