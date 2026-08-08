import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import authMiddleware from "../middleware/auth.js";
import { registerRules, loginRules } from "../validators/authValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", authMiddleware, getMe); // protected

export default router;
