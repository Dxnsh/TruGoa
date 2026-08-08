import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import Tourist from "../models/Tourist.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /tourist/google
// The frontend sends the Google ID token ("credential") from the
// GoogleLogin credential flow. We verify it server-side and derive the
// tourist's identity ONLY from the verified payload — request-body
// identity fields are never trusted, since they'd otherwise let anyone
// forge a session for any account.
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new ApiError(401, "Invalid Google credential");
  }

  const { sub: googleId, email, name, picture: avatar } = payload;

  let tourist = await Tourist.findOne({ googleId });

  if (!tourist) {
    tourist = await Tourist.create({ name, email, googleId, avatar });
  } else if (tourist.avatar !== avatar) {
    tourist.avatar = avatar;
    await tourist.save();
  }

  const token = jwt.sign({ id: tourist._id }, process.env.TOURIST_JWT_SECRET, { expiresIn: "30d" });

  sendSuccess(res, {
    message: "Signed in",
    data: {
      token,
      tourist: {
        _id: tourist._id,
        name: tourist.name,
        email: tourist.email,
        avatar: tourist.avatar,
      },
    },
  });
});

// GET /tourist/me
export const getMe = asyncHandler(async (req, res) => {
  const tourist = await Tourist.findById(req.user._id).select("-googleId");
  if (!tourist) throw new ApiError(404, "Tourist not found");

  sendSuccess(res, { data: tourist });
});

// GET /tourist/favorites — populated saved places
export const getFavorites = asyncHandler(async (req, res) => {
  const tourist = await Tourist.findById(req.user._id).populate("favorites");
  if (!tourist) throw new ApiError(404, "Tourist not found");

  sendSuccess(res, { data: tourist.favorites });
});

// POST /tourist/favorites/:businessId
export const addFavorite = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  await Tourist.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: businessId } });

  sendSuccess(res, { message: "Saved" });
});

// DELETE /tourist/favorites/:businessId
export const removeFavorite = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  await Tourist.findByIdAndUpdate(req.user._id, { $pull: { favorites: businessId } });

  sendSuccess(res, { message: "Removed" });
});
