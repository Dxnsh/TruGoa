import express from "express";
import { cacheResponse } from "../middleware/cacheMiddleware.js";
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  uploadImages,
} from "../controllers/businessController.js";
import upload        from "../middleware/upload.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// BUG FIX: GET / must come before GET /:id
// otherwise Express could match "/" with /:id = ""
router.get("/", getBusinesses);
router.get("/:id", cacheResponse(600), getBusinessById);

router.post("/",        authMiddleware,              createBusiness);
router.post("/upload", authMiddleware, upload.array("images",5), uploadImages);

export default router;