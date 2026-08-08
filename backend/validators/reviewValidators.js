import { body, query, param } from "express-validator";

export const addReviewRules = [
  body("business_id").isMongoId().withMessage("A valid business_id is required."),
  body("name").custom((value, { req }) => {
    const name = req.user ? req.user.name : value;
    if (!name || !String(name).trim()) throw new Error("name is required.");
    return true;
  }),
  body("rating").isFloat({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5."),
  body("comment").isString().trim().isLength({ min: 10 }).withMessage("Review comment is too short."),
  body("title").optional().isString().trim(),
  body("city").optional().isString().trim(),
  body("country").optional().isString().trim(),
  body("images").optional().isArray(),
  body("tags").optional().isArray(),
];

export const getReviewsRules = [
  query("business_id").isMongoId().withMessage("A valid business_id query param is required."),
];

export const reviewIdParamRules = [
  param("id").isMongoId().withMessage("Invalid review id."),
];

export const ownerReplyRules = [
  param("id").isMongoId().withMessage("Invalid review id."),
  body("text").isString().trim().notEmpty().withMessage("Reply text is required."),
];
