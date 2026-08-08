import { body } from "express-validator";

export const registerRules = [
  body("name").isString().trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const loginRules = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
];
