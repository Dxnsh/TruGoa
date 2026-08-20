import bcrypt from "bcryptjs";
import AdminUser from "../models/AdminUser.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const BCRYPT_ROUNDS = 12;

// passwordHash is `select: false`, so it never rides along in these responses.
const LIST_SORT = { createdAt: 1 };

// GET /admin/users
export const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await AdminUser.find().sort(LIST_SORT);
  sendSuccess(res, { data: users });
});

// POST /admin/users
export const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const user = await AdminUser.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      role: role === "owner" ? "owner" : "editor",
    });

    // Re-read so the response goes through the same projection as the list,
    // rather than echoing back the document that still holds the hash.
    sendSuccess(res, {
      statusCode: 201,
      message: "Admin added",
      data: await AdminUser.findById(user._id),
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "An admin with this email already exists");
    }
    throw err;
  }
});

// Counting the remaining active owners guards every path that could leave the
// dashboard with nobody able to manage it — demotion, deactivation and delete.
const assertNotLastOwner = async (target) => {
  if (target.role !== "owner" || !target.active) return;

  const otherOwners = await AdminUser.countDocuments({
    _id: { $ne: target._id },
    role: "owner",
    active: true,
  });
  if (otherOwners === 0) {
    throw new ApiError(409, "This is the last active owner — promote someone else first");
  }
};

// PATCH /admin/users/:id — role and active flag
export const updateAdminUser = asyncHandler(async (req, res) => {
  const { role, active } = req.body;

  const user = await AdminUser.findById(req.params.id);
  if (!user) throw new ApiError(404, "Admin not found");

  // Locking yourself out is always a mistake, never an intent.
  if (user._id.equals(req.admin._id)) {
    throw new ApiError(409, "You can't change your own role or access");
  }

  const losingOwnerAccess =
    (role !== undefined && role !== "owner") || active === false;
  if (losingOwnerAccess) await assertNotLastOwner(user);

  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  await user.save();

  sendSuccess(res, { message: "Admin updated", data: user });
});

// PUT /admin/users/:id/password
export const resetAdminPassword = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id);
  if (!user) throw new ApiError(404, "Admin not found");

  user.passwordHash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
  await user.save();

  sendSuccess(res, { message: "Password updated" });
});

// DELETE /admin/users/:id
export const deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id);
  if (!user) throw new ApiError(404, "Admin not found");

  if (user._id.equals(req.admin._id)) {
    throw new ApiError(409, "You can't delete your own account");
  }
  await assertNotLastOwner(user);

  await user.deleteOne();
  sendSuccess(res, { message: "Admin removed" });
});

// GET /admin/me — who the current token belongs to, so the dashboard can hide
// the team tab from editors instead of letting them open it and get a 403.
export const getCurrentAdmin = asyncHandler(async (req, res) => {
  const { _id, name, email, role } = req.admin;
  sendSuccess(res, { data: { id: _id, name, email, role } });
});
