import { useState } from "react";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../LoginModal/LoginModal";
import "./ReviewForm.css";
import { createReview } from "../../services/api";

export default function ReviewForm({ businessId, fetchReviews }) {
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { isTouristLoggedIn, tourist } = useTourist();
  const [showLogin, setShowLogin] = useState(false);

  const submit = async () => {
    if (!isTouristLoggedIn) {
      setShowLogin(true);
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      alert("Please write at least a short sentence about your experience.");
      return;
    }

    try {
      setLoading(true);

      await createReview({
        business_id: businessId,
        city,
        rating,
        comment,
      });

      setCity("");
      setComment("");
      setRating(5);

      fetchReviews();
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h2>Share Your Experience</h2>

      {isTouristLoggedIn && (
        <p className="review-form-signed-in">Posting as <strong>{tourist.name}</strong></p>
      )}

      <input
        placeholder="Your city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <textarea
        style={{ margin: "10px" }}
        placeholder="What made this place memorable?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
      >
        <option value={5}>5 Stars</option>
        <option value={4}>4 Stars</option>
        <option value={3}>3 Stars</option>
        <option value={2}>2 Stars</option>
        <option value={1}>1 Star</option>
      </select>

      <button onClick={submit} disabled={loading}>
        {loading ? "Submitting..." : "Submit Review"}
      </button>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
          message="Sign in to write a review"
        />
      )}
    </div>
  );
}
