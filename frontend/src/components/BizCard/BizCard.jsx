import { useNavigate } from "react-router-dom";
import StarRating from "../StarRating/StarRating";
import { theme } from "../../Theme";

const gradients = {
  "🍽️": "linear-gradient(135deg, #fef3c7, #fde68a)",
  "🏕️": "linear-gradient(135deg, #d1fae5, #a7f3d0)",
  "🌊": "linear-gradient(135deg, #dbeafe, #bfdbfe)",
  "☕": "linear-gradient(135deg, #fce7f3, #fbcfe8)",
  "🫒": "linear-gradient(135deg, #f0fdf4, #dcfce7)",
  "🛍️": "linear-gradient(135deg, #fef9c3, #fef08a)",
};

const BizCard = ({ biz }) => {
  const navigate = useNavigate();
  const hasPhoto = biz.images && biz.images.length > 0;

  return (
    <div
      onClick={() => navigate(`/listings/${biz.id}`)}
      style={{
        background: theme.colors.bgCard,
        borderRadius: theme.radii.lg,
        overflow: "hidden",
        boxShadow: theme.shadows.card,
        cursor: "pointer",
        transition: theme.transitions.spring,
        border: `1px solid ${theme.colors.borderLight}`,
        fontFamily: theme.typography.fontBody,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = theme.shadows.cardHover;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = theme.shadows.card;
      }}
    >
      {/* ── IMAGE AREA ─────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        {hasPhoto ? (
          // ✅ real photo from Cloudinary
          <img
            src={biz.images[0]}
            alt={biz.name}
            style={{
              width: "100%",
              height: 200,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          // fallback gradient + emoji
          <div style={{
            width: "100%",
            height: 200,
            background: gradients[biz.emoji] || theme.colors.bgSurface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
          }}>
            {biz.emoji}
          </div>
        )}

        {/* dark overlay on real photos for badge readability */}
        {hasPhoto && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 50%)",
          }} />
        )}

        {/* photo count badge — only if more than 1 photo */}
        {biz.images && biz.images.length > 1 && (
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            borderRadius: theme.radii.pill,
            padding: "3px 10px",
            fontSize: 11,
            color: "white",
            fontWeight: theme.typography.weightMedium,
          }}>
            📷 {biz.images.length}
          </div>
        )}

        {/* BADGES */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          {biz.trust === "verified" && (
            <span style={{
              padding: "4px 10px", borderRadius: theme.radii.pill,
              fontSize: 11, fontWeight: theme.typography.weightBold,
              background: "rgba(255,255,255,0.95)",
              color: theme.colors.secondary,
            }}>
              ✓ Verified
            </span>
          )}
          {biz.badge === "top" && (
            <span style={{
              padding: "4px 10px", borderRadius: theme.radii.pill,
              fontSize: 11, fontWeight: theme.typography.weightBold,
              background: theme.colors.primary,
              color: theme.colors.textPrimary,
            }}>
              ⭐ Top Rated
            </span>
          )}
          {biz.badge === "new" && (
            <span style={{
              padding: "4px 10px", borderRadius: theme.radii.pill,
              fontSize: 11, fontWeight: theme.typography.weightBold,
              background: theme.colors.accentLight,
              color: theme.colors.accentText,
            }}>
              ✨ New
            </span>
          )}
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────── */}
      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{
          fontSize: 11, color: theme.colors.textMuted,
          fontWeight: theme.typography.weightMedium,
          letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6,
        }}>
          {biz.category}
        </div>
        <div style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: 18, fontWeight: theme.typography.weightBold,
          color: theme.colors.textPrimary, marginBottom: 6,
          letterSpacing: "-0.3px",
        }}>
          {biz.name}
        </div>
        <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 12 }}>
          📍 {biz.location}
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 14, paddingTop: 14,
          borderTop: `1px solid ${theme.colors.borderLight}`,
        }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: theme.typography.weightMedium, color: theme.colors.textPrimary }}>
              {biz.price}
            </span>
            <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
              {" "}/ {biz.priceLabel}
            </span>
          </div>
          <StarRating rating={biz.rating} count={biz.reviews} />
        </div>
      </div>
    </div>
  );
};

export default BizCard;