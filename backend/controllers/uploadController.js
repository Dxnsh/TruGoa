import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Cloudinary's plan caps individual uploads at 10MB — shrink anything larger
// (re-encoding as JPEG and stepping quality down) so it clears that ceiling.
const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024;

const compressUnderLimit = async (buffer) => {
  if (buffer.length <= CLOUDINARY_MAX_BYTES) return buffer;

  let quality = 80;
  let output = await sharp(buffer)
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();

  while (output.length > CLOUDINARY_MAX_BYTES && quality > 30) {
    quality -= 10;
    output = await sharp(buffer)
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  return output;
};

const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "trugoa",
        transformation: [{ width: 1600, height: 1200, crop: "limit" }, { quality: "auto" }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

// ── POST /admin/upload — multipart field name "images" (1 or many) ────
export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }
  const buffers = await Promise.all(req.files.map((f) => compressUnderLimit(f.buffer)));
  const results = await Promise.all(buffers.map(streamUpload));

  sendSuccess(res, { data: { urls: results.map((r) => r.secure_url) } });
});
