import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import Tourist from "../models/Tourist.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/tourist/google
export const googleAuth = async (req, res) => {
  try {
    const { googleId, name, email, avatar } = req.body; // ✅ receive user info directly

    if (!googleId || !email) {
      return res.status(400).json({ error: "Google ID and email are required" });
    }

    // find or create tourist
    let tourist = await Tourist.findOne({ googleId });

    if (!tourist) {
      tourist = await Tourist.create({ name, email, googleId, avatar });
    } else {
      // update avatar if changed
      if (tourist.avatar !== avatar) {
        tourist.avatar = avatar;
        await tourist.save();
      }
    }

    const token = jwt.sign(
      { id: tourist._id, role: "tourist" },
      process.env.TOURIST_JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      tourist: {
        id:     tourist._id,
        name:   tourist.name,
        email:  tourist.email,
        avatar: tourist.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/tourist/me
export const getMe = async (req, res) => {
  try {
    const tourist = await Tourist.findById(req.touristId).select("-googleId");
    if (!tourist) return res.status(404).json({ error: "Tourist not found" });
    res.json(tourist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

