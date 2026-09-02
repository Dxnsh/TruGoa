import Story from "../models/Story.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Public read routes ----------------------------------------------------

// GET /stories — published only, summary fields
export const getStories = asyncHandler(async (req, res) => {
  const stories = await Story.find({ published: true })
    .select("category slug title desc image readTime")
    .sort({ createdAt: -1 });

  sendSuccess(res, { data: stories });
});

// GET /stories/:slug — published only, full detail. A draft 404s here rather
// than being reachable by anyone who guesses or is sent the slug.
export const getStoryBySlug = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ slug: req.params.slug, published: true });
  if (!story) throw new ApiError(404, "Story not found");

  sendSuccess(res, { data: story });
});

// GET /admin/stories — every story, drafts included, for the dashboard.
// There was no admin listing at all, so adding the published flag would
// otherwise have left drafts invisible to the people who have to publish them.
export const adminGetStories = asyncHandler(async (req, res) => {
  const stories = await Story.find()
    .select("category slug title desc image readTime published createdAt")
    .sort({ createdAt: -1 });

  sendSuccess(res, { data: stories });
});

// GET /admin/stories/:slug — full detail, drafts included.
export const adminGetStory = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ slug: req.params.slug });
  if (!story) throw new ApiError(404, "Story not found");

  sendSuccess(res, { data: story });
});

// Admin-authenticated mutations ------------------------------------------

// POST /admin/stories
export const createStory = asyncHandler(async (req, res) => {
  const {
    category, slug, title, desc, image, readTime,
    manifestoTitle, manifestoText1, manifestoText2,
    stories, published,
  } = req.body;

  try {
    const story = await Story.create({
      category: category.trim(),
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      desc, image, readTime,
      manifestoTitle, manifestoText1, manifestoText2,
      stories: stories || [],
      // Explicit opt-in, matching the Journal: a new story is a draft unless
      // the dashboard says otherwise.
      published: published === true,
    });

    sendSuccess(res, { statusCode: 201, message: "Story created", data: story });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "A story collection with this slug already exists");
    }
    throw err;
  }
});

// PUT /admin/stories/:id
const STORY_EDITABLE_FIELDS = [
  "category", "slug", "title", "desc", "image", "readTime",
  "manifestoTitle", "manifestoText1", "manifestoText2", "stories", "published",
];

export const updateStory = asyncHandler(async (req, res) => {
  const updates = {};
  for (const field of STORY_EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.slug) updates.slug = updates.slug.trim().toLowerCase();

  try {
    const story = await Story.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!story) throw new ApiError(404, "Story not found");

    sendSuccess(res, { message: "Story updated", data: story });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "A story collection with this slug already exists");
    }
    throw err;
  }
});

// DELETE /admin/stories/:id
export const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findByIdAndDelete(req.params.id);
  if (!story) throw new ApiError(404, "Story not found");

  sendSuccess(res, { message: "Story deleted" });
});
