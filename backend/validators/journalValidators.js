import { body, param } from "express-validator";

export const journalSlugParamRules = [
  param("slug").isString().trim().notEmpty(),
];

export const createJournalRules = [
  body("slug").isString().trim().notEmpty().withMessage("Slug is required"),
  body("title").isString().trim().notEmpty().withMessage("Title is required"),
  body("content").isString().trim().notEmpty().withMessage("Content is required"),
  body("coverImage").isString().trim().notEmpty().withMessage("Cover image is required"),
  body("excerpt").optional().isString(),
  body("author").optional().isString(),
  body("readTime").optional().isString(),
  body("tags").optional().isArray(),
  body("published").optional().isBoolean(),
];

export const updateJournalRules = [
  param("id").isMongoId().withMessage("Invalid journal id"),
  body("slug").optional().isString().trim().notEmpty(),
  body("title").optional().isString().trim().notEmpty(),
  body("content").optional().isString().trim().notEmpty(),
  body("coverImage").optional().isString().trim().notEmpty(),
  body("tags").optional().isArray(),
  body("published").optional().isBoolean(),
];

export const journalIdParamRules = [
  param("id").isMongoId().withMessage("Invalid journal id"),
];
