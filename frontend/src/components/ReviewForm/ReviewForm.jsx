import { useState } from "react";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../LoginModal/LoginModal";
import "./ReviewForm.css" 
import { createReview } from "../../services/api";

export default function ReviewForm({ businessId, fetchReviews }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { isTouristLoggedIn } = useTourist();
  const [showLogin, setShowLogin] = useState(false);

  const submit = async () => {

    if (!name.trim() || !comment.trim()) {
      alert("Please enter name and comment");
      return;
    }

    if (!isTouristLoggedIn) {
        setShowLogin(true);
        return;
    }

    try {
        setLoading(true);

      await createReview({
            business_id: businessId,
            name,
            city,
            rating,
            comment
            });

        if (!name || !comment.trim()) {
        alert("Please fill all fields");
        return;
      }

      setName("");
      setCity("");
      setComment("");
      setRating(5);

      fetchReviews();

    } catch (err) {
      alert("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h2>Share Your Experience</h2>

      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Your city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <textarea
        style={{margin:"10px"}}
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

      <button onClick={submit}>
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