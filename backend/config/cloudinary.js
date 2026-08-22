import 'dotenv/config';
import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// .env is gitignored, so nothing carries these into a deployment — every
// environment has to set them by hand. When they're missing, config() accepts
// three undefineds without complaint and the failure surfaces much later, as
// an upload rejected deep inside the Cloudinary SDK. That arrives as an
// unexpected 5xx, which the error handler masks in production, so the browser
// shows "Something went wrong" and the real cause — an unset variable — is
// invisible from both ends.
export const isCloudinaryConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key:    API_KEY,
  api_secret: API_SECRET,
});

export default cloudinary;