import Blog from "../models/Blog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Public read routes ----------------------------------------------------

// GET /blogs — summary fields only
export const getBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find()
    .select("slug title excerpt coverImage author readTime tags createdAt")
    .sort({ createdAt: -1 });

  sendSuccess(res, { data: blogs });
});

// GET /blogs/:slug — full detail
export const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug });
  if (!blog) throw new ApiError(404, "Blog not found");

  sendSuccess(res, { data: blog });
});

// Admin-authenticated mutations ------------------------------------------

// POST /admin/blogs
export const createBlog = asyncHandler(async (req, res) => {
  const { slug, title, excerpt, content, coverImage, author, readTime, tags } = req.body;

  try {
    const blog = await Blog.create({
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      excerpt, content, coverImage, author, readTime,
      tags: tags || [],
    });

    sendSuccess(res, { statusCode: 201, message: "Blog created", data: blog });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "A blog with this slug already exists");
    }
    throw err;
  }
});

// PUT /admin/blogs/:id
const BLOG_EDITABLE_FIELDS = [
  "slug", "title", "excerpt", "content", "coverImage", "author", "readTime", "tags",
];

export const updateBlog = asyncHandler(async (req, res) => {
  const updates = {};
  for (const field of BLOG_EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.slug) updates.slug = updates.slug.trim().toLowerCase();

  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!blog) throw new ApiError(404, "Blog not found");

    sendSuccess(res, { message: "Blog updated", data: blog });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "A blog with this slug already exists");
    }
    throw err;
  }
});

// DELETE /admin/blogs/:id
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found");

  sendSuccess(res, { message: "Blog deleted" });
});
