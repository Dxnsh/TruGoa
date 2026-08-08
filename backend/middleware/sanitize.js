// middleware/sanitize.js
//
// Strips `$`/`.` keys from req.body/params/query to block NoSQL operator
// injection (e.g. { "email": { "$ne": null } }).
//
// We deliberately don't use express-mongo-sanitize's default middleware
// export: it reassigns req.query (`req.query = target`), which throws under
// Express 5 since req.query is a getter-only accessor there. Its `sanitize()`
// helper mutates the object in place instead, so we call that directly and
// skip the reassignment entirely.
import { sanitize } from "express-mongo-sanitize";

export const sanitizeInput = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
};
