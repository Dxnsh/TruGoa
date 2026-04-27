import jwt from "jsonwebtoken";
import Business from "../models/Business.js";

// POST /api/admin/login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { role: "admin" },
        process.env.ADMIN_JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/businesses — all listings for admin
export const getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/admin/businesses/:id/approve
export const approveBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!business) return res.status(404).json({ error: "Business not found" });
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/admin/businesses/:id/reject
export const rejectBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!business) return res.status(404).json({ error: "Business not found" });
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/businesses/stats
export const getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Business.countDocuments(),
      Business.countDocuments({ status: "pending" }),
      Business.countDocuments({ status: "approved" }),
      Business.countDocuments({ status: "rejected" }),
    ]);
    res.json({ total, pending, approved, rejected });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};