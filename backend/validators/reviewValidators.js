import { body, query, param } from "express-validator";

// Review images are only ever produced by our own Cloudinary upload route, so
// this is an allowlist rather than a URL check. Accepting any URL let a review
// body point at an arbitrary host — the image renders on the listing page, so
// that is someone else's content served under TruGoa's name, and a tracking
// pixel for every visitor who scrolls past it.
//
// The host is derived from the configured cloud name, so a deployment pointed
// at a different Cloudinary account keeps working without a code change.
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

export const isAllowedImageUrl = (value) => {
  if (typeof value !== "string" || value.length > 500) return false;

  let url;
  try {
    url = new URL(value);
  } catch {
    return false; // not a URL at all
  }

  if (url.protocol !== "https:") return false;
  if (url.hostname !== "res.cloudinary.com") return false;

  // Path is /<cloud_name>/… — pin it to this deployment's account so another
  // Cloudinary tenant's assets are not accepted either.
  if (!CLOUD_NAME) return false;
  return url.pathname.startsWith(`/${CLOUD_NAME}/`);
};

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
  body("images")
    .optional()
    .isArray({ max: 6 })
    .withMessage("At most 6 images.")
    .bail()
    .custom((images) => {
      for (const url of images) {
        if (!isAllowedImageUrl(url)) {
          throw new Error("Images must be uploaded through TruGoa.");
        }
      }
      return true;
    }),
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
