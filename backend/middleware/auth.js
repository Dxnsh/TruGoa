import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

// Owner auth — attaches req.ownerId
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Not authorized. Please log in."));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.ownerId = decoded.id;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token. Please log in again."));
  }
};

export default authMiddleware;
