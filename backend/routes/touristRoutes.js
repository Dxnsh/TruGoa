import express from "express";
import {
  googleAuth,
  getMe,
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../controllers/touristController.js";
import { protectTourist } from "../middleware/authMiddleware.js";
import { googleAuthRules, businessIdParamRules } from "../validators/touristValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post("/google", googleAuthRules, validate, googleAuth);
router.get("/me", protectTourist, getMe);

router.get("/favorites", protectTourist, getFavorites);
router.post("/favorites/:businessId", protectTourist, businessIdParamRules, validate, addFavorite);
router.delete("/favorites/:businessId", protectTourist, businessIdParamRules, validate, removeFavorite);

export default router;
