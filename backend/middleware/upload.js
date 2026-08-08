import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

// Store files in memory as Buffer — we upload to Cloudinary manually
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only JPG, PNG and WebP images are allowed"));
    }
  },
});

export default upload;