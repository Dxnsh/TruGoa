import mongoose from "mongoose";

// One document per enquiry sent through the contact form on /contact.
//
// The form used to report success without sending anything anywhere, so
// everything written through it since launch was lost. These are stored rather
// than emailed: the platform has no mail provider yet, and a row in the
// database is the smallest thing that stops an enquiry disappearing. Email
// notification can read from here later without changing what the form does.
//
// The topic list mirrors the dropdown in
// frontend/src/pages/StaticPages/ContactPage.jsx — an enum so a hand-crafted
// request can't store a topic the form never offered.
export const CONTACT_TOPICS = [
  "Planning a trip",
  "Recommending a place",
  "My business",
  "Press & partnerships",
  "Something else",
];

const contactMessageSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 80 },
  email:   { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  topic:   { type: String, required: true, enum: CONTACT_TOPICS },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

// Newest first — the order anyone reading the enquiries would want them in.
contactMessageSchema.index({ createdAt: -1 });

export default mongoose.model("ContactMessage", contactMessageSchema);
