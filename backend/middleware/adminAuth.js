import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";
import { ApiError } from "../utils/ApiError.js";

// Verifies the bearer token and loads the person behind it.
//
// The account is re-read on every request rather than trusted from the token
// body: tokens live for a day, so a deactivated partner would otherwise keep
// full access until theirs expired. This costs one indexed lookup per admin
// request, which only staff make.
const adminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Not authorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    const admin = await AdminUser.findById(decoded.sub);
    if (!admin || !admin.active) {
      return next(new ApiError(401, "Not authorized"));
    }

    // Downstream handlers read the role from here, never from the token, so a
    // role change also takes effect on the next request.
    req.admin = admin;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

// Guards the team-management routes. Editors can publish content; only owners
// can add, demote or revoke other people.
export const ownerOnly = (req, res, next) => {
  if (req.admin?.role !== "owner") {
    return next(new ApiError(403, "Only an owner can manage admin accounts"));
  }
  next();
};

export default adminAuth;
