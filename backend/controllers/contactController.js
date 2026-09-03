import ContactMessage from "../models/ContactMessage.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// POST /contact — public
//
// Fields are named one by one rather than handed req.body, so an extra key in
// the request body is dropped instead of reaching the document.
//
// sendSuccess runs only after create() resolves. If the write fails, the throw
// propagates to the central error handler and the caller gets a 5xx — the form
// must never report success for an enquiry that wasn't stored, which is the
// whole reason this endpoint exists.
export const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, topic, message } = req.body;

  await ContactMessage.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    topic,
    message: message.trim(),
  });

  // No data is echoed back: the sender already has everything they typed, and
  // the stored document has nothing they need.
  sendSuccess(res, {
    statusCode: 201,
    message: "Message received",
  });
});
