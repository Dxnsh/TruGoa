import { body, param } from "express-validator";

export const storySlugParamRules = [
  param("slug").isString().trim().notEmpty(),
];

export const createStoryRules = [
  body("category").isString().trim().notEmpty().withMessage("Category is required"),
  body("slug").isString().trim().notEmpty().withMessage("Slug is required"),
  body("title").isString().trim().notEmpty().withMessage("Title is required"),
  body("image").isString().trim().notEmpty().withMessage("Image is required"),
  body("desc").optional().isString(),
  body("readTime").optional().isString(),
  body("manifestoTitle").optional().isString(),
  body("manifestoText1").optional().isString(),
  body("manifestoText2").optional().isString(),
  body("stories").optional().isArray(),
  body("published").optional().isBoolean(),
];

export const updateStoryRules = [
  param("id").isMongoId().withMessage("Invalid story id"),
  body("category").optional().isString().trim().notEmpty(),
  body("slug").optional().isString().trim().notEmpty(),
  body("title").optional().isString().trim().notEmpty(),
  body("image").optional().isString().trim().notEmpty(),
  body("stories").optional().isArray(),
  body("published").optional().isBoolean(),
];

export const storyIdParamRules = [
  param("id").isMongoId().withMessage("Invalid story id"),
];
