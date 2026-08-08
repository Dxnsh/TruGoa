// middleware/validateFileContent.js
//
// multer's fileFilter (middleware/upload.js) only checks the client-supplied
// mimetype field, which is trivially spoofable — a renamed/relabeled file
// passes as long as the Content-Type claim matches. This reads the actual
// magic bytes from each uploaded buffer and rejects anything that isn't
// really one of the allowed image types.
import { fileTypeFromBuffer } from "file-type";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const validateFileContent = asyncHandler(async (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (files.length === 0) return next();

  for (const file of files) {
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
      throw new ApiError(400, `"${file.originalname}" is not a valid JPG, PNG or WebP image`);
    }
  }

  next();
});
