import Review from "../models/Review.js";
import Business from "../models/Business.js";

// POST /api/reviews
export const addReview = async (req, res) => {
  try {
    const { business_id, name, city, rating, comment } = req.body; // ✅ explicit fields only

    // Validate required fields
    if (!business_id || !name || !rating || !comment) {
      return res.status(400).json({ error: "business_id, name, rating and comment are required" });
    }

    // Check the business actually exists
    const business = await Business.findById(business_id);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Create the review with only the fields we allow
    const review = await Review.create({ business_id, name, city, rating, comment }); // ✅ no raw req.body

    // Recalculate average rating on the business
    const allReviews = await Review.find({ business_id });
    const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    await Business.findByIdAndUpdate(business_id, {
      rating: Math.round(avg * 10) / 10,   // round to 1 decimal e.g. 4.3
      review_count: allReviews.length,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/reviews?business_id=xxx
export const getReviewsForBusiness = async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({ error: "business_id query param is required" });
    }

    const reviews = await Review.find({ business_id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};