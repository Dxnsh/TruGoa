import express from "express";
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  uploadImages

} from "../controllers/businessController.js";
import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createBusiness);
router.get("/:id", getBusinessById); 
router.get("/", getBusinesses);
router.post("/upload", upload.array("images", 5), uploadImages);


export default router;