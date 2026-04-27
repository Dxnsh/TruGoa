import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StarRating from "../../components/StarRating/StarRating";
import { getBusinessById, getReviewsForBusiness, getBusinesses } from "../../services/api";
import { mapBusiness } from "../../services/mapper";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../../components/LoginModal/LoginModal";
import useIsMobile from "../../hooks/useIsMobile";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import "./DetailPage.css";

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════ */
function Lightbox({ images, startIndex, onClose }) {

  const [reviews, setReviews] = useState([]);
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() =>
    setCurrent(c => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() =>
    setCurrent(c => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div className="lb-overlay" onClick={onClose}>
      <div className="lb-inner" onClick={e => e.stopPropagation()}>

        {/* close */}
        <button className="lb-close" onClick={onClose}>✕</button>

        {/* counter */}
        <div className="lb-counter">{current + 1} / {images.length}</div>

        {/* image */}
        <img
          key={current}
          src={images[current]}
          alt={`Photo ${current + 1}`}
          className="lb-img"
        />

        {/* arrows */}
        {images.length > 1 && (
          <>
            <button className="lb-arrow lb-arrow-left"  onClick={prev}>‹</button>
            <button className="lb-arrow lb-arrow-right" onClick={next}>›</button>
          </>
        )}

        {/* thumbnail strip */}
        {images.length > 1 && (
          <div className="lb-thumbs no-scrollbar">
            {images.map((img, i) => (
              <div
                key={i}
                className={`lb-thumb ${i === current ? "active" : ""}`}
                onClick={() => setCurrent(i)}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TRUST SCORE CARD
══════════════════════════════════════════════════════════ */
function TrustScore({ biz }) {
  const items = [
    {
      icon: "✦",
      label: "Physically Verified",
      desc: "Our team visited this location",
      done: biz.trust === "verified" || biz.trust_level === "verified",
    },
    {
      icon: "◈",
      label: "Menu Prices Confirmed",
      desc: "Prices match what locals pay",
      done: !!biz.price || !!biz.price_range,
    },
    {
      icon: "★",
      label: "Community Reviews",
      desc: `${biz.reviews || biz.review_count || 0} verified guest reviews`,
      done: (biz.reviews || biz.review_count || 0) > 0,
    },
    {
      icon: "⚑",
      label: "Zero Scam Reports",
      desc: "No complaints in last 12 months",
      done: true,
    },
    {
      icon: "✿",
      label: "Local Endorsement",
      desc: "Recommended by Goa residents",
      done: biz.trust === "verified" || biz.trust_level === "verified",
    },
  ];

  const score = Math.round((items.filter(i => i.done).length / items.length) * 100);

  return (
    <div className="trust-card">
      <p className="trust-eyebrow">TruGoa Trust Score</p>
      <div className="trust-score-row">
        <span className="trust-score-num">{score}</span>
        <div className="trust-score-info">
          <span className="trust-score-label">/ 100</span>
          <span className={`trust-score-badge ${score >= 80 ? "high" : score >= 60 ? "mid" : "low"}`}>
            {score >= 80 ? "Highly Trusted" : score >= 60 ? "Trusted" : "Under Review"}
          </span>
        </div>
      </div>

      {/* progress bar */}
      <div className="trust-bar-track">
        <div className="trust-bar-fill" style={{ width: `${score}%` }} />
      </div>

      <div className="trust-items">
        {items.map((item, i) => (
          <div key={i} className={`trust-item ${item.done ? "done" : "pending"}`}>
            <div className="trust-item-icon">{item.done ? "✓" : "○"}</div>
            <div>
              <div className="trust-item-label">{item.label}</div>
              <div className="trust-item-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function DetailPage() {
  const { id }     = useParams();
  console.log("Route ID:", id);
  const navigate   = useNavigate();
  const isMobile   = useIsMobile();
  const { isTouristLoggedIn } = useTourist();

  const [biz,        setBiz       ] = useState(null);
  const [reviews,    setReviews   ] = useState([]);
  const [similar,    setSimilar   ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [error,      setError     ] = useState(null);
  const [lightboxIdx,setLightboxIdx] = useState(null);  // null = closed
  const [showLogin,  setShowLogin ] = useState(false);

  /* ── fetch ──────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [bizData, reviewsData, allBiz] = await Promise.all([
          getBusinessById(id),
          getReviewsForBusiness(id),
          getBusinesses(),
        ]);
        const mapped = mapBusiness(bizData, 0);
        setBiz(mapped);
        setReviews(
        Array.isArray(reviewsData)
          ? reviewsData
          : Array.isArray(reviewsData.reviews)
          ? reviewsData.reviews
          : []
      );

        // similar: same category, exclude current
        const sim = allBiz
          .filter(b => b._id !== id &&
            b.category?.toLowerCase() === bizData.category?.toLowerCase()
          )
          .slice(0, 4)
          .map((b, i) => mapBusiness(b, i));
        setSimilar(sim);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* ── loading ─────────────────────────────────────────────── */
  if (loading) return (
    <div className="dp-loading">
      <div className="dp-loading-ring" />
      <p className="dp-loading-text">Loading…</p>
    </div>
  );

  if (error || !biz) return (
    <div className="dp-error">
      <div className="dp-error-icon">😕</div>
      <h2 className="dp-error-title">Business not found</h2>
      <button className="dp-btn-gold" onClick={() => navigate("/listings")}>
        Back to Listings
      </button>
    </div>
  );

  const images = biz.images?.length > 0 ? biz.images : [];
  const hasMultiple = images.length > 1;

  return (
    <div className="dp-root">

      {/* ══════════════════════════════════════════════════════
          PHOTO GALLERY HERO
      ══════════════════════════════════════════════════════ */}
      <div className="dp-gallery" style={{ height: isMobile ? 320 : 520 }}>

        {/* Back button */}
        <button className="dp-back" onClick={() => navigate("/listings")}>
          ← Back
        </button>

        {images.length === 0 ? (
          /* No photos — gradient placeholder */
          <div className="dp-gallery-placeholder">
            <span className="dp-gallery-emoji">{biz.emoji}</span>
          </div>
        ) : images.length === 1 ? (
          /* Single photo — full bleed */
          <div
            className="dp-gallery-single"
            style={{ backgroundImage: `url(${images[0]})` }}
            onClick={() => setLightboxIdx(0)}
          />
        ) : (
          /* Multiple photos — editorial grid */
          <div className={`dp-gallery-grid ${images.length >= 3 ? "grid-3" : "grid-2"}`}>
            {/* Main large photo */}
            <div
              className="dp-gallery-main"
              style={{ backgroundImage: `url(${images[0]})` }}
              onClick={() => setLightboxIdx(0)}
            />
            {/* Secondary photos */}
            <div className="dp-gallery-secondary">
              {images.slice(1, isMobile ? 2 : 4).map((img, i) => (
                <div
                  key={i}
                  className="dp-gallery-thumb"
                  style={{ backgroundImage: `url(${img})` }}
                  onClick={() => setLightboxIdx(i + 1)}
                >
                  {/* "View all" overlay on last thumb */}
                  {i === (isMobile ? 0 : 2) && images.length > (isMobile ? 2 : 4) && (
                    <div className="dp-gallery-more" onClick={() => setLightboxIdx(i + 1)}>
                      +{images.length - (isMobile ? 2 : 4)} photos
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom overlay with badges */}
        <div className="dp-gallery-overlay" />
        <div className="dp-gallery-badges">
          {(biz.trust === "verified" || biz.trust_level === "verified") && (
            <span className="dp-badge-verified">✓ Verified Business</span>
          )}
          {biz.badge === "top" && (
            <span className="dp-badge-top">⭐ Top Rated</span>
          )}
          {hasMultiple && (
            <button
              className="dp-badge-photos"
              onClick={() => setLightboxIdx(0)}
            >
              📷 View all {images.length} photos
            </button>
          )}
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════
          BODY GRID
      ══════════════════════════════════════════════════════ */}
      <div
        className="dp-body"
        style={{
          padding: isMobile ? "32px 20px" : "56px clamp(32px,6vw,96px)",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
        }}
      >

        {/* ── LEFT COLUMN ─────────────────────────────────── */}
        <div className="dp-left">

          {/* category eyebrow */}
          <p className="dp-category">{biz.category}</p>

          {/* name */}
          <h1 className="dp-name"
            style={{ fontSize: isMobile ? "clamp(32px,9vw,52px)" : "clamp(40px,5vw,68px)" }}>
            {biz.name}
          </h1>

          {/* rating + location */}
          <div className="dp-meta">
            <StarRating rating={biz.rating} count={biz.reviews} />
            <span className="dp-location">📍 {biz.location}</span>
          </div>

          {/* tags */}
          {biz.tags?.length > 0 && (
            <div className="dp-tags">
              {biz.tags.map(t => (
                <span key={t} className="dp-tag">{t}</span>
              ))}
            </div>
          )}

          <div className="dp-rule" />

          {/* description */}
          <p className="dp-desc">{biz.desc}</p>

          {/* local tip */}
          {biz.localTip && (
            <div className="dp-tip">
              <div className="dp-tip-icon">💡</div>
              <div>
                <div className="dp-tip-label">Local Insider Tip</div>
                <div className="dp-tip-text">{biz.localTip}</div>
              </div>
            </div>
          )}

          {/* ── TRUST SCORE ─────────────────────────────────── */}
          <TrustScore biz={biz} />
   
         
        <div className="dp-reviews-wrap">

          <div className="dp-reviews-header">
            <div>
      

              <h2 className="dp-reviews-title">
                Guest Reviews
                {reviews.length > 0 && (
                  <span className="dp-reviews-count">
                    {reviews.length}
                  </span>
                )}
              </h2>
            </div>

            {biz.rating > 0 && (
              <div className="dp-rating-summary">
                <div className="dp-rating-big">{biz.rating}</div>
                <div>
                  <StarRating rating={biz.rating} />
                  <p className="dp-rating-label">
                    Based on {biz.review_count} trusted reviews
                  </p>
                </div>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="dp-no-reviews">
              <div className="dp-no-review-icon">✍️</div>
              <h3>No stories yet</h3>
              <p>
                Be the first guest to share what made this place memorable.
              </p>
            </div>
          ) : (
            <div className="dp-reviews-grid">
              {reviews.map((r, i) => (
                <article key={i} className="dp-review-card">

                  {/* Quote Mark */}
                  <div className="dp-review-quote">“</div>

                  {/* Top */}
                  <div className="dp-review-top">
                    <StarRating rating={r.rating} />

                    {r.verifiedBooking && (
                      <span className="dp-verified-badge">
                        Verified Guest
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  {r.title && (
                    <h3 className="dp-review-title">
                      {r.title}
                    </h3>
                  )}

                  {/* Comment */}
                  <p className="dp-review-comment">
                    {r.comment}
                  </p>

                  {/* Images */}
                  {r.images?.length > 0 && (
                    <div className="dp-review-images">
                      {r.images.slice(0,3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt=""
                          className="dp-review-img"
                        />
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="dp-review-rule" />

                  <div className="dp-review-author">

                    <div className="dp-review-avatar">
                      {r.name?.[0]?.toUpperCase()}
                    </div>

                    <div className="dp-review-author-info">
                      <div className="dp-review-name">
                        {r.name}
                      </div>

                      <div className="dp-review-meta">
                        {r.city && `📍 ${r.city} · `}
                        {new Date(r.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Owner Reply */}
                  {r.ownerReply?.text && (
                    <div className="dp-owner-reply">
                      <div className="dp-owner-reply-label">
                        Reply from TruGoa Partner
                      </div>

                      <p>{r.ownerReply.text}</p>
                    </div>
                  )}

                  {/* Helpful */}
                  <button className="dp-helpful-btn">
                    Helpful ({r.helpfulCount || 0})
                  </button>

                </article>
              ))}
            </div>
          )}
        </div>

       <ReviewForm
        businessId={id}
        fetchReviews={async () => {
          const data = await getReviewsForBusiness(id);

          setReviews(
            Array.isArray(data)
              ? data
              : Array.isArray(data.reviews)
              ? data.reviews
              : []
          );
        }}
        />
        </div>


        {/* ── RIGHT COLUMN — BOOKING CARD ─────────────────── */}
        <div className="dp-right">
          <div className="dp-booking-card">

            {/* price */}
            <div className="dp-price">{biz.price}</div>
            <div className="dp-price-label">per {biz.priceLabel}</div>

            <div className="dp-booking-rule" />

            {/* CTA */}
            <button
              className="dp-btn-book"
              onClick={() => {
                if (!isTouristLoggedIn) {
                  setShowLogin(true);
                } else {
                  navigate(`/booking/${biz.id}`);
                }
              }}
            >
              📅 Book Now
            </button>

            <button
              className="dp-btn-ai"
              onClick={() => navigate("/goaguide")}
            >
              💬 Ask GoaGuide AI
            </button>

            {/* trust features */}
            <div className="dp-booking-features">
              {[
                "✓ Verified & trusted business",
                "✓ Price matches local rates",
                "✓ Free cancellation (24hr)",
                "✓ Instant confirmation",
              ].map(f => (
                <div key={f} className="dp-booking-feature">{f}</div>
              ))}
            </div>

            {/* fair price badge */}
            <div className="dp-fair-price">
              <span className="dp-fair-price-icon">₹</span>
              <div>
                <div className="dp-fair-price-title">Fair Price Guaranteed</div>
                <div className="dp-fair-price-sub">
                  No hidden fees · No tourist markup
                </div>
              </div>
            </div>
          </div>

          {/* contact */}
          {biz.contact && (
            <div className="dp-contact-card">
              <p className="dp-contact-label">Contact</p>
              <p className="dp-contact-val">{biz.contact}</p>
            </div>
          )}
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════
          SIMILAR LISTINGS
      ══════════════════════════════════════════════════════ */}
      {similar.length > 0 && (
        <div
          className="dp-similar"
          style={{ padding: isMobile ? "56px 20px" : "72px clamp(32px,6vw,96px)" }}
        >
          <div className="dp-similar-header">
            <div>
              <p className="dp-similar-eyebrow">You Might Also Like</p>
              <h2 className="dp-similar-title"
                style={{ fontSize: isMobile ? 32 : "clamp(32px,4vw,52px)" }}>
                More {biz.category} in Goa
              </h2>
            </div>
            <button
              className="dp-similar-all"
              onClick={() => navigate(`/listings?category=${encodeURIComponent(biz.category)}`)}
            >
              View all →
            </button>
          </div>

          <div
            className="dp-similar-grid"
            style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)" }}
          >
            {similar.map((s, i) => (
              <div
                key={s.id}
                className="dp-similar-card"
                onClick={() => navigate(`/listings/${s.id}`)}
              >
                <div
                  className="dp-similar-img"
                  style={{
                    backgroundImage: s.images?.[0] ? `url(${s.images[0]})` : undefined,
                    background: s.images?.[0] ? undefined : "#EDE8DD",
                  }}
                >
                  {!s.images?.[0] && (
                    <span style={{ fontSize: 32 }}>{s.emoji}</span>
                  )}
                  {(s.trust === "verified" || s.trust_level === "verified") && (
                    <span className="dp-similar-verified">✓</span>
                  )}
                </div>
                <div className="dp-similar-body">
                  <p className="dp-similar-category">{s.category}</p>
                  <h3 className="dp-similar-name">{s.name}</h3>
                  <div className="dp-similar-meta">
                    <StarRating rating={s.rating} />
                    <span className="dp-similar-price">{s.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════
          LIGHTBOX
      ══════════════════════════════════════════════════════ */}
      {lightboxIdx !== null && images.length > 0 && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* Login modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
          message="Sign in to book this place"
        />
      )}
    </div>
  );
}