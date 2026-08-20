import Journal from "../models/Journal.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const SUMMARY_FIELDS = "slug title excerpt coverImage author readTime tags published createdAt";

// Public read routes ----------------------------------------------------

// GET /journals — published entries only, summary fields
export const getJournals = asyncHandler(async (req, res) => {
  const journals = await Journal.find({ published: true })
    .select(SUMMARY_FIELDS)
    .sort({ createdAt: -1 });

  sendSuccess(res, { data: journals });
});

// GET /journals/:slug — published entry, full detail. Drafts 404 here on
// purpose: knowing a slug shouldn't expose an unfinished entry.
export const getJournalBySlug = asyncHandler(async (req, res) => {
  const journal = await Journal.findOne({ slug: req.params.slug, published: true });
  if (!journal) throw new ApiError(404, "Journal entry not found");

  sendSuccess(res, { data: journal });
});

// Admin-authenticated reads ----------------------------------------------

// GET /admin/journals — drafts included, so the dashboard can list everything
export const adminGetJournals = asyncHandler(async (req, res) => {
  const journals = await Journal.find()
    .select(SUMMARY_FIELDS)
    .sort({ createdAt: -1 });

  sendSuccess(res, { data: journals });
});

// GET /admin/journals/:id — full detail for the edit form, drafts included
export const adminGetJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findById(req.params.id);
  if (!journal) throw new ApiError(404, "Journal entry not found");

  sendSuccess(res, { data: journal });
});

// Admin-authenticated mutations ------------------------------------------

// POST /admin/journals
export const createJournal = asyncHandler(async (req, res) => {
  const { slug, title, excerpt, content, coverImage, author, readTime, tags, published } = req.body;

  try {
    const journal = await Journal.create({
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      excerpt, content, coverImage, author, readTime,
      tags: tags || [],
      published: published === true,
    });

    sendSuccess(res, { statusCode: 201, message: "Journal entry created", data: journal });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "A journal entry with this slug already exists");
    }
    throw err;
  }
});

// PUT /admin/journals/:id
const JOURNAL_EDITABLE_FIELDS = [
  "slug", "title", "excerpt", "content", "coverImage", "author", "readTime", "tags", "published",
];

export const updateJournal = asyncHandler(async (req, res) => {
  const updates = {};
  for (const field of JOURNAL_EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.slug) updates.slug = updates.slug.trim().toLowerCase();

  try {
    const journal = await Journal.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!journal) throw new ApiError(404, "Journal entry not found");

    sendSuccess(res, { message: "Journal entry updated", data: journal });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "A journal entry with this slug already exists");
    }
    throw err;
  }
});

// DELETE /admin/journals/:id
export const deleteJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findByIdAndDelete(req.params.id);
  if (!journal) throw new ApiError(404, "Journal entry not found");

  sendSuccess(res, { message: "Journal entry deleted" });
});
