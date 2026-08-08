import Business from "../models/Business.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// GET /businesses — public, returns approved businesses (all statuses shown in dev)
export const getBusinesses = asyncHandler(async (req, res) => {
  const { category, area, priceLevel, featured, search } = req.query;

  const filter = {};

  if (process.env.NODE_ENV !== "development") {
    filter.status = "approved";
  }

  if (category) filter.category = { $regex: `^${category}$`, $options: "i" };
  if (area) filter.area = { $regex: `^${area}$`, $options: "i" };
  if (priceLevel) filter.priceLevel = priceLevel;
  if (featured) filter.featured = true;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { area: { $regex: search, $options: "i" } },
    ];
  }

  const businesses = await Business.find(filter).sort({
    editorPick: -1,
    featured: -1,
    createdAt: -1,
  });

  sendSuccess(res, { data: businesses });
});

// GET /businesses/slug/:slug — public
export const getBusinessBySlug = asyncHandler(async (req, res) => {
  const filter = { slug: req.params.slug };
  if (process.env.NODE_ENV !== "development") filter.status = "approved";

  const business = await Business.findOne(filter);
  if (!business) throw new ApiError(404, "Business not found");

  sendSuccess(res, { data: business });
});

// GET /businesses/:id — public
export const getBusinessById = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) throw new ApiError(404, "Business not found");

  sendSuccess(res, { data: business });
});
