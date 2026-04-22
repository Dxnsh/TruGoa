import express from "express";
import { googleAuth, getMe } from "../controllers/touristController.js";
import touristAuth from "../middleware/touristAuth.js";

const router = express.Router();

router.post("/google", googleAuth);          
router.get("/me",      touristAuth, getMe);  

export default router;