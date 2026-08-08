import jwt from "jsonwebtoken";
import Tourist from "../models/Tourist.js";
import { ApiError } from "../utils/ApiError.js";

export const protectTourist = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.TOURIST_JWT_SECRET);

    req.user = await Tourist.findById(decoded.id).select("-googleId");

    if (!req.user) {
      return next(new ApiError(401, "User not found"));
    }

    next();
  } catch (error) {
    next(new ApiError(401, "Invalid token"));
  }
};

export const optionalTourist = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.TOURIST_JWT_SECRET);
    req.user = await Tourist.findById(decoded.id).select("-googleId");
    next();
  } catch (error) {
    next(); // invalid/expired token — just continue as guest
  }
};
