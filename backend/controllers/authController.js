import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Owner from "../models/Owner.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyPassword } from "../utils/passwordAuth.js";

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

  // Emails are stored lowercase by the schema, so normalise before matching.
  const owner = await Owner.findOne({ email: String(email).trim().toLowerCase() });

  // The comparison runs whether or not the account exists — against the stored
  // hash when it does, a dummy one when it doesn't. Returning early on an
  // unknown email skipped the bcrypt work entirely, so an unknown address
  // answered in about a millisecond where a real one took a hundred, and the
  // two separate messages below said which was which outright. Either half
  // turns this form into a way to find out who has an account.
  const passwordOk = await verifyPassword(password, owner?.password);

  // One response for both failure modes — a caller learns that the pair was
  // wrong, never which half of it.
  if (!owner || !passwordOk) {
    throw new ApiError(401, "Invalid email or password");
  }

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
