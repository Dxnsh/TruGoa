import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Not authorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== "admin") {
      return next(new ApiError(401, "Not authorized"));
    }
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export default adminAuth;
