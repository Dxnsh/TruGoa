import { body, param } from "express-validator";

// Long enough to resist an offline guess against a leaked hash. These accounts
// publish to a live site, so the floor is higher than a throwaway signup.
const PASSWORD_MIN = 10;

export const createAdminUserRules = [
  body("name").isString().trim().notEmpty().withMessage("Name is required"),
  // Deliberately not normalizeEmail(): its Gmail defaults strip dots and
  // +tags from the local part, so "a.b@gmail.com" was stored as "ab@gmail.com"
  // while login looked up the address as typed — the account existed but
  // could never be found. Store what was entered, lowercased, and let login
  // do the same.
  body("email")
    .isEmail().withMessage("A valid email is required")
    .trim()
    .toLowerCase(),
  body("password")
    .isString()
    .isLength({ min: PASSWORD_MIN })
    .withMessage(`Password must be at least ${PASSWORD_MIN} characters`),
  body("role").optional().isIn(["owner", "editor"]).withMessage("Invalid role"),
];

export const updateAdminUserRules = [
  param("id").isMongoId().withMessage("Invalid admin id"),
  body("role").optional().isIn(["owner", "editor"]).withMessage("Invalid role"),
  body("active").optional().isBoolean(),
];

export const resetAdminPasswordRules = [
  param("id").isMongoId().withMessage("Invalid admin id"),
  body("password")
    .isString()
    .isLength({ min: PASSWORD_MIN })
    .withMessage(`Password must be at least ${PASSWORD_MIN} characters`),
];

export const adminUserIdParamRules = [
  param("id").isMongoId().withMessage("Invalid admin id"),
];
