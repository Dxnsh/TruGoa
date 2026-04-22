const StarRating = ({ rating, count }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: "#f59e0b", fontSize: 13 }}>
          {i <= Math.floor(rating) ? "★" : "☆"}
        </span>
      ))}
      <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1f1c" }}>
        {rating}
      </span>
      {count && (
        <span style={{ fontSize: 12, color: "#8a9e94" }}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
};

export default StarRating;