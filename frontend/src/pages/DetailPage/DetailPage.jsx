import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StarRating from "../../components/StarRating/StarRating";
import { getBusinessById, getReviewsForBusiness } from "../../services/api";
import { mapBusiness } from "../../services/mapper";
import { theme } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../../components/LoginModal/LoginModal";

import {
  Badge,
  PrimaryButton,
  GhostButton,
  SurfaceCard,
  Alert,
  LoadingState,
} from "../../Theme";

const gradients = {
  "🍽️": `linear-gradient(135deg, ${theme.colors.primaryLight}, #fde68a)`,
  "🏕️": `linear-gradient(135deg, #d1fae5, #a7f3d0)`,
  "🌊": `linear-gradient(135deg, #dbeafe, #bfdbfe)`,
  "☕": `linear-gradient(135deg, #fce7f3, #fbcfe8)`,
  "🫒": `linear-gradient(135deg, ${theme.colors.secondaryLight}, #bbf7d0)`,
  "🛍️": `linear-gradient(135deg, #fef9c3, #fef08a)`,
};

const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [biz, setBiz] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isTouristLoggedIn } = useTourist();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [bizData, reviewsData] = await Promise.all([
          getBusinessById(id),
          getReviewsForBusiness(id),
        ]);
        setBiz(mapBusiness(bizData, 0));
        setReviews(reviewsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return <LoadingState message="Loading business details..." />;

  if (error || !biz) return (
    <div style={{ textAlign: "center", padding: 80, fontFamily: theme.typography.fontBody }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <div style={{
        fontFamily: theme.typography.fontDisplay,
        fontSize: 24,
        fontWeight: theme.typography.weightBold,
        color: theme.colors.textPrimary,
        marginBottom: 8,
      }}>
        Business not found
      </div>
      <PrimaryButton onClick={() => navigate("/listings")}>
        Back to Listings
      </PrimaryButton>
    </div>
  );

  return (
    <div style={{ fontFamily: theme.typography.fontBody, background: theme.colors.bgPage }}>


     {/* ── BANNER ─────────────────────────────────────────── */}
<div style={{
  position: "relative",
  height: "clamp(280px,40vh,480px)",
  background: biz.images?.length > 0
    ? "#000"
    : gradients[biz.emoji] || theme.colors.bgSurface,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
}}>

  {/* back button */}
  <button
    onClick={() => navigate("/listings")}
    style={{
      position: "absolute", top: 20,
      left: "clamp(16px,4vw,64px)",
      zIndex: 10,
      background: "rgba(255,255,255,0.92)",
      border: `1px solid ${theme.colors.borderLight}`,
      borderRadius: theme.radii.pill,
      padding: "10px 20px", fontSize: 13,
      fontWeight: theme.typography.weightMedium,
      cursor: "pointer",
      display: "flex", alignItems: "center", gap: 6,
      fontFamily: theme.typography.fontBody,
      backdropFilter: "blur(8px)",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "white"}
    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.92)"}
  >
    ← Back
  </button>

  {biz.images?.length > 0 ? (
    // ✅ real photo — full bleed
    <img
      src={biz.images[0]}
      alt={biz.name}
      style={{
        width: "100%", height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  ) : (
    // fallback emoji
    <span style={{
      fontSize: 110,
      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))",
    }}>
      {biz.emoji}
    </span>
  )}

  {/* dark overlay */}
  <div style={{
    position: "absolute", inset: 0,
    background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)",
  }} />

  {/* thumbnail strip — if more than 1 photo */}
  {biz.images?.length > 1 && (
    <div style={{
      position: "absolute", bottom: 70,
      left: "clamp(16px,6vw,96px)",
      display: "flex", gap: 8,
    }}>
      {biz.images.slice(1, 5).map((url, i) => (
        <img
          key={i} src={url}
          alt={`photo ${i + 2}`}
          style={{
            width: 56, height: 56,
            objectFit: "cover",
            borderRadius: theme.radii.sm,
            border: "2px solid rgba(255,255,255,0.8)",
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  )}

  {/* badges */}
  <div style={{
    position: "absolute", bottom: 24,
    left: "clamp(16px,6vw,96px)",
    display: "flex", gap: 8,
  }}>
    {biz.trust === "verified" && (
      <span style={{
        padding: "6px 14px", borderRadius: theme.radii.pill,
        fontSize: 13, fontWeight: theme.typography.weightBold,
        background: "rgba(255,255,255,0.95)",
        color: theme.colors.secondary,
      }}>
        ✓ Verified Business
      </span>
    )}
    {biz.badge === "top" && (
      <span style={{
        padding: "6px 14px", borderRadius: theme.radii.pill,
        fontSize: 13, fontWeight: theme.typography.weightBold,
        background: theme.colors.primary,
        color: theme.colors.textPrimary,
      }}>
        ⭐ Top Rated
      </span>
    )}
  </div>
</div>

      {/* ── BODY ───────────────────────────────────────────── */}
      <div style={{
       padding: isMobile ? "20px 16px" : `clamp(24px,4vh,48px) ${theme.spacing.pagePadding}`,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
        gap: isMobile ? 20 : 40,
      }}>

        {/* ── LEFT ─────────────────────────────────────────── */}
        <div>

          {/* category label */}
          <div style={{
            fontSize: 11,
            color: theme.colors.textMuted,
            fontWeight: theme.typography.weightMedium,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            {biz.category}
          </div>

          {/* name */}
          <h1 style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: "clamp(26px,4vw,42px)",
            fontWeight: theme.typography.weightBlack,
            color: theme.colors.textPrimary,
            letterSpacing: "-1px",
            marginBottom: 12,
          }}>
            {biz.name}
          </h1>

          {/* rating + location */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            flexWrap: "wrap",
          }}>
            <StarRating rating={biz.rating} count={biz.reviews} />
            <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              📍 {biz.location}
            </span>
          </div>

          {/* tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {biz.tags.map(t => (
              <Badge key={t} variant="verified">{t}</Badge>
            ))}
          </div>

          {/* description */}
          <p style={{
            fontSize: 15,
            color: theme.colors.textBody,
            lineHeight: theme.typography.lineHeightRelaxed,
            marginBottom: 28,
          }}>
            {biz.desc}
          </p>

          {/* local tip */}
          <Alert variant="success" style={{ marginBottom: 28, borderRadius: theme.radii.md }}>
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontWeight: theme.typography.weightBold,
              fontSize: 14,
              color: theme.colors.secondaryText,
              marginBottom: 8,
            }}>
              🧠 Local Insider Tip
            </div>
            <div style={{
              fontSize: 13,
              color: theme.colors.secondaryText,
              lineHeight: theme.typography.lineHeightRelaxed,
            }}>
              {biz.localTip}
            </div>
          </Alert>

          {/* ── REVIEWS ──────────────────────────────────────── */}
          <div style={{
            fontFamily: theme.typography.fontDisplay,
            fontWeight: theme.typography.weightBold,
            fontSize: 20,
            color: theme.colors.textPrimary,
            marginBottom: 18,
          }}>
            Guest Reviews{" "}
            {reviews.length > 0 && (
              <span style={{
                fontSize: 14,
                fontWeight: theme.typography.weightRegular,
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fontBody,
              }}>
                ({reviews.length})
              </span>
            )}
          </div>

          {/* no reviews yet */}
          {reviews.length === 0 && (
            <SurfaceCard style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✍️</div>
              <div style={{
                fontSize: 14,
                color: theme.colors.textMuted,
                lineHeight: theme.typography.lineHeightRelaxed,
              }}>
                No reviews yet. Be the first to share your experience!
              </div>
            </SurfaceCard>
          )}

          {/* review cards */}
          {reviews.map((r, i) => (
            <div key={i} style={{
              background: theme.colors.bgSurface,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.lg,
              padding: 20,
              marginBottom: 14,
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: "50%",
                    background: theme.colors.primaryLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: theme.typography.fontDisplay,
                    fontWeight: theme.typography.weightBold,
                    color: theme.colors.primaryText,
                    fontSize: 16,
                  }}>
                    {r.name[0]}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: theme.typography.weightMedium,
                      fontSize: 14,
                      color: theme.colors.textPrimary,
                    }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      📍 {r.city}
                    </div>
                  </div>
                </div>
                <StarRating rating={r.rating} />
              </div>
              <div style={{
                fontSize: 13,
                color: theme.colors.textBody,
                lineHeight: theme.typography.lineHeightRelaxed,
                fontStyle: "italic",
              }}>
                "{r.comment}"
              </div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 8 }}>
                {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT — BOOKING CARD ──────────────────────────── */}
        <div>
          <div style={{
            order: isMobile ? -1 : 0,
            background: theme.colors.bgCard,
            borderRadius: theme.radii.xl,
            padding: 28,
            boxShadow: theme.shadows.modal,
            border: `1px solid ${theme.colors.borderLight}`,
            position: "sticky",
            top: 100,
          }}>

            {/* price */}
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 36,
              fontWeight: theme.typography.weightBlack,
              color: theme.colors.textPrimary,
              marginBottom: 2,
            }}>
              {biz.price}
            </div>
            <div style={{
              fontSize: 13,
              color: theme.colors.textMuted,
              marginBottom: 24,
              paddingBottom: 20,
              borderBottom: `1px solid ${theme.colors.borderLight}`,
            }}>
              per {biz.priceLabel}
            </div>

            {/* book now */}
           <PrimaryButton
            onClick={() => {
              if (!isTouristLoggedIn) {
                setShowLoginModal(true); // ✅ show modal if not logged in
              } else {
                navigate(`/booking/${biz.id}`) 
              }
            }}
            style={{ width: "100%", borderRadius: theme.radii.lg, padding: 16, marginBottom: 12, fontSize: 15 }}
          >
            📅 Book Now
          </PrimaryButton>

          {/* login modal */}
          {showLoginModal && (
            <LoginModal
              onClose={() => setShowLoginModal(false)}
              onSuccess={() => setShowLoginModal(false)}
              message="Sign in to book this place"
            />
          )}

            {/* ask AI */}
            <GhostButton
              onClick={() => navigate("/goaguide")}
              style={{ width: "100%", borderRadius: theme.radii.lg, padding: 14, fontSize: 14 }}
            >
              💬 Ask GoaGuide AI
            </GhostButton>

            {/* trust features */}
            <div style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              paddingTop: 20,
              borderTop: `1px solid ${theme.colors.borderLight}`,
            }}>
              {[
                "✓ Verified & trusted business",
                "✓ Best price guaranteed",
                "✓ Free cancellation (24hr)",
                "✓ Local tip included",
              ].map(f => (
                <div key={f} style={{
                  fontSize: 13,
                  color: theme.colors.textBody,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  {f}
                </div>
              ))}
            </div>

            {/* fair price alert */}
            <Alert variant="warning" style={{ marginTop: 20, borderRadius: theme.radii.md }}>
              <strong style={{ color: theme.colors.primaryText }}>💡 Fair Price Alert</strong>
              <br />
              <span style={{ fontSize: 12, lineHeight: 1.6 }}>
                This listing shows real market prices — no hidden fees, no tourist markup.
              </span>
            </Alert>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;