import express from "express";
import {
  adminLogin,
  getAllBusinesses,
  approveBusiness,
  rejectBusiness,
  getStats,
} from "../controllers/adminController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/login",                        adminLogin);
router.get("/businesses",     adminAuth,     getAllBusinesses);
router.get("/stats",          adminAuth,     getStats);
router.patch("/businesses/:id/approve", adminAuth, approveBusiness);
router.patch("/businesses/:id/reject",  adminAuth, rejectBusiness);

export default router;