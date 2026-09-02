import { body } from "express-validator";

// Caps are enforced here rather than trimmed in the controller: a request that
// exceeds them is rejected, so a caller is told their input was too large
// instead of silently getting an answer to a truncated conversation.
export const chatRules = [
  body("messages")
    .isArray({ min: 1, max: 20 })
    .withMessage("messages must be an array of 1–20 messages"),

  // "system" is deliberately absent. The server prepends its own system prompt
  // and a client-supplied one would land after it, overriding the GoaGuide
  // persona and turning the endpoint into a general-purpose LLM proxy on
  // TruGoa's Groq credits.
  body("messages.*.role")
    .isIn(["user", "assistant"])
    .withMessage("Each message role must be 'user' or 'assistant'"),

  body("messages.*.content")
    .isString()
    .withMessage("Each message needs string content")
    .bail()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Each message must be between 1 and 2000 characters"),
];
