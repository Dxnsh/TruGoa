import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { isDevelopment } from "../config/env.js";

// 404 — route not found
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

// Global error handler — catches everything
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Something went wrong";
  let errors = err.errors || [];

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(". ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") { statusCode = 401; message = "Invalid token"; }
  if (err.name === "TokenExpiredError") { statusCode = 401; message = "Token expired"; }

  // Multer upload errors (file too large, too many files, etc.)
  if (err instanceof MulterError) {
    statusCode = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.message;
  }

  const isKnown = err instanceof ApiError || err instanceof MulterError || statusCode < 500;

  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    ip: req.ip,
    stack: err.stack,
  });

  // Never leak internal error details for unexpected (5xx) failures. Keyed on
  // isDevelopment, not on NODE_ENV === production, so an unset variable hides
  // the detail rather than publishing it.
  if (!isKnown && !isDevelopment) {
    message = "Something went wrong";
    errors = [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(isDevelopment && { stack: err.stack }),
  });
};
