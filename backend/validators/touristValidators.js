import { body, param } from "express-validator";

export const googleAuthRules = [
  body("credential").isString().trim().notEmpty().withMessage("Google credential is required"),
];

export const businessIdParamRules = [
  param("businessId").isMongoId().withMessage("Invalid business id"),
];
