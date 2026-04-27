import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import Tourist from "../models/Tourist.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/tourist/google
export const googleAuth = async (req, res) => {
  try {
    const { googleId, name, email, avatar } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: "Google ID and email are required" });
    }

    let tourist = await Tourist.findOne({ googleId });

    if (!tourist) {
      tourist = await Tourist.create({ name, email, googleId, avatar });
    } else {
      if (tourist.avatar !== avatar) {
        tourist.avatar = avatar;
        await tourist.save();
      }
    }

    // ── ONE secret, ONE token ──────────────────────────
    const token = jwt.sign(
      { id: tourist._id },
      process.env.JWT_SECRET,        // ← same secret as protectTourist
      { expiresIn: "30d" }
    );

    res.json({
      token,
      tourist: {
        _id:    tourist._id,         // ← was _id (undefined variable)
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

