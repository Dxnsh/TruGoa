import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Owner from "../models/Owner.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await Owner.findOne({ email });
  if (existing) throw new ApiError(400, "An account with this email already exists");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const owner = await Owner.create({ name, email, password: hashedPassword });

  sendSuccess(res, {
    statusCode: 201,
    message: "Account created",
    data: {
      token: createToken(owner._id),
      owner: { id: owner._id, name: owner.name, email: owner.email },
    },
  });
});

// POST /auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const owner = await Owner.findOne({ email });
  if (!owner) throw new ApiError(400, "No account found with this email");

  const isMatch = await bcrypt.compare(password, owner.password);
  if (!isMatch) throw new ApiError(400, "Incorrect password");

  sendSuccess(res, {
    message: "Login successful",
    data: {
      token: createToken(owner._id),
      owner: { id: owner._id, name: owner.name, email: owner.email },
    },
  });
});

// GET /auth/me — protected
export const getMe = asyncHandler(async (req, res) => {
  const owner = await Owner.findById(req.ownerId).select("-password");
  if (!owner) throw new ApiError(404, "Owner not found");

  sendSuccess(res, { data: owner });
});
