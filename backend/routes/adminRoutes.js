import express from "express";
import {
  adminLogin,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getAllBusinesses,
  approveBusiness,
  rejectBusiness,
  getStats,
} from "../controllers/adminController.js";
import {
  createStory,
  updateStory,
  deleteStory,
} from "../controllers/storyController.js";
import {
  adminGetJournals,
  adminGetJournal,
  createJournal,
  updateJournal,
  deleteJournal,
} from "../controllers/journalController.js";
import { uploadImages } from "../controllers/uploadController.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js";
import { validateFileContent } from "../middleware/validateFileContent.js";
import { adminLoginLimiter } from "../middleware/rateLimiter.js";
import {
  adminLoginRules,
  createBusinessRules,
  updateBusinessRules,
  businessIdParamRules,
} from "../validators/adminValidators.js";
import {
  createStoryRules,
  updateStoryRules,
  storyIdParamRules,
} from "../validators/storyValidators.js";
import {
  createJournalRules,
  updateJournalRules,
  journalIdParamRules,
} from "../validators/journalValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post("/login", adminLoginLimiter, adminLoginRules, validate, adminLogin);

router.post("/businesses", adminAuth, createBusinessRules, validate, createBusiness);
router.get("/businesses", adminAuth, getAllBusinesses);
router.put("/businesses/:id", adminAuth, updateBusinessRules, validate, updateBusiness);
router.delete("/businesses/:id", adminAuth, businessIdParamRules, validate, deleteBusiness);
router.get("/stats", adminAuth, getStats);
router.patch("/businesses/:id/approve", adminAuth, businessIdParamRules, validate, approveBusiness);
router.patch("/businesses/:id/reject", adminAuth, businessIdParamRules, validate, rejectBusiness);

router.post("/stories", adminAuth, createStoryRules, validate, createStory);
router.put("/stories/:id", adminAuth, updateStoryRules, validate, updateStory);
router.delete("/stories/:id", adminAuth, storyIdParamRules, validate, deleteStory);

// Journal — the admin list includes drafts, which the public routes hide.
router.get("/journals", adminAuth, adminGetJournals);
router.get("/journals/:id", adminAuth, journalIdParamRules, validate, adminGetJournal);
router.post("/journals", adminAuth, createJournalRules, validate, createJournal);
router.put("/journals/:id", adminAuth, updateJournalRules, validate, updateJournal);
router.delete("/journals/:id", adminAuth, journalIdParamRules, validate, deleteJournal);

// Legacy aliases for the pre-rename /admin/blogs paths.
router.post("/blogs", adminAuth, createJournalRules, validate, createJournal);
router.put("/blogs/:id", adminAuth, updateJournalRules, validate, updateJournal);
router.delete("/blogs/:id", adminAuth, journalIdParamRules, validate, deleteJournal);

router.post("/upload", adminAuth, upload.array("images", 10), validateFileContent, uploadImages);

export default router;
