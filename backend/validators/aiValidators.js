import { body } from "express-validator";

export const chatRules = [
  body("messages").isArray({ min: 1 }).withMessage("message array is required"),
  body("messages.*.role").isIn(["user", "assistant", "system"]),
  body("messages.*.content").isString(),
];
