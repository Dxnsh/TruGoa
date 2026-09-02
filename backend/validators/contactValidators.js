import { body } from "express-validator";
import { CONTACT_TOPICS } from "../models/ContactMessage.js";

// The form checks these too, but that check runs in the browser and is the
// caller's to skip — the endpoint is public, so these rules are what actually
// decide what gets stored.
//
// Deliberately no minimum message length: the form has never asked for one, and
// adding one here would start rejecting short but legitimate enquiries ("please
// call me") with an error the page never warned about.
export const createContactMessageRules = [
  body("name")
    .isString().withMessage("Name is required")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 80 }).withMessage("Name is too long"),
  // trim() must come before isEmail(): the chain runs in declared order, so
  // validating first would reject "  you@example.com " — a padded address is
  // exactly what a browser autofill or a mobile keyboard tends to submit.
  //
  // Not normalizeEmail(): its Gmail defaults strip dots and +tags, which would
  // store a different address from the one the sender typed and expects a reply at.
  body("email")
    .trim()
    .isEmail().withMessage("A valid email is required")
    .isLength({ max: 254 }).withMessage("Email is too long"),
  body("topic")
    .isIn(CONTACT_TOPICS).withMessage("Please choose one of the listed topics"),
  body("message")
    .isString().withMessage("Message is required")
    .trim()
    .notEmpty().withMessage("Message is required")
    .isLength({ max: 2000 }).withMessage("Message is too long (2000 characters max)"),
];
