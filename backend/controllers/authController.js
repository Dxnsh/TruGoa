import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Owner from "../models/Owner.js";

// helper — creates a signed JWT token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // validate fields
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    // check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // check password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // check if email already exists
    const existing = await Owner.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    // hash the password — never store plain text
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create the owner
    const owner = await Owner.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // return token + owner info (never return the password)
    res.status(201).json({
      token: createToken(owner._id),
      owner: {
        id:    owner._id,
        name:  owner.name,
        email: owner.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // find owner by email
    const owner = await Owner.findOne({ email: email.toLowerCase() });
    if (!owner) {
      return res.status(400).json({ error: "No account found with this email" });
    }

    // compare password with hashed version
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // return token + owner info
    res.json({
      token: createToken(owner._id),
      owner: {
        id:    owner._id,
        name:  owner.name,
        email: owner.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/auth/me  — get logged in owner from token
export const getMe = async (req, res) => {
  try {
    const owner = await Owner.findById(req.ownerId).select("-password");
    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }
    res.json(owner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};