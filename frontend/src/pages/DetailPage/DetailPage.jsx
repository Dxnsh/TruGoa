import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin, Heart, Share2, Camera, ChevronRight, Navigation,
  Bookmark, Clock, Users, Sun, Compass, Utensils, Waves,
  Sparkles, Phone, Globe, IndianRupee, Maximize2, X,
} from "lucide-react";
import StarRating from "../../components/StarRating/StarRating";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import {
  getBusinessById, getBusinessBySlug, getBusinesses,
  getReviewsForBusiness, markReviewHelpful,
  getFavorites, addFavorite, removeFavorite,
} from "../../services/api";
import { mapBusiness } from "../../services/mapper";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../../components/LoginModal/LoginModal";
import SEO, { SITE_URL } from "../../components/SEO/SEO";
import useIsMobile from "../../hooks/useIsMobile";
import "./DetailPage.css";

const WHY_ICONS = [Sparkles, Waves, Compass, Camera, Utensils];
const STORY_PREVIEW_LEN = 320;

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════ */
function Lightbox({ images, startIndex, onClose }) {
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
        <button className="lb-close" onClick={onClose}>✕</button>
        <div className="lb-counter">{current + 1} / {images.length}</div>
        <img key={current} src={images[current]} alt={`Photo ${current + 1}`} className="lb-img" />
        {images.length > 1 && (
          <>
            <button className="lb-arrow lb-arrow-left" onClick={prev}>‹</button>
            <button className="lb-arrow lb-arrow-right" onClick={next}>›</button>
          </>
        )}
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
   MAP MODAL — expands the map in-page (no new tab)
══════════════════════════════════════════════════════════ */
function MapModal({ biz, mapEmbedSrc, directionsUrl, onClose, saved, onToggleSave }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="dp-map-modal-overlay" onClick={onClose}>
      <div className="dp-map-modal" onClick={e => e.stopPropagation()}>
        <div className="dp-map-modal-frame">
          {mapEmbedSrc ? (
            <iframe
              title="expanded location map"
              src={mapEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="dp-map-placeholder">
              <MapPin size={22} />
              <span>Map unavailable</span>
            </div>
          )}
        </div>

        <div className="dp-map-modal-side">
          <button className="dp-map-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
          <h3 className="dp-map-modal-title">{biz.name}</h3>
          <div className="dp-map-modal-rule" />
          <p className="dp-card-address">{biz.location || "Location not available"}</p>

          <div className="dp-map-actions" style={{ marginTop: "auto" }}>
            <a className="dp-map-btn primary" href={directionsUrl} target="_blank" rel="noreferrer">
              <Navigation size={14} /> Directions
            </a>
            <button className="dp-map-btn" onClick={onToggleSave}>
              <Bookmark size={14} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save Place"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   INFO CARD — one unified sidebar card: location, map,
   directions/save actions, and a quick-facts list. Rows only
   render when the underlying data actually exists.
══════════════════════════════════════════════════════════ */
function InfoCard({ biz, nearbyNames, saved, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);
  const hasCoords = biz.latitude && biz.longitude;
  const mapEmbedSrc = hasCoords
    ? `https://www.google.com/maps?q=${biz.latitude},${biz.longitude}&z=14&output=embed`
    : biz.location
    ? `https://www.google.com/maps?q=${encodeURIComponent(biz.location)}&z=13&output=embed`
    : null;
  const directionsUrl = biz.googleMapUrl
    || (hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(biz.location)}`);

  const facts = [
    { label: "Best Time to Visit", value: biz.bestTime, icon: Sun },
    { label: "Ideal For",          value: biz.idealFor?.length ? biz.idealFor.join(", ") : "", icon: Users },
    { label: "Price",              value: biz.price && biz.price !== "Contact for price" ? biz.price : "", icon: IndianRupee },
    { label: "Timings",            value: biz.openingHours, icon: Clock },
    { label: "Duration",           value: biz.visitDuration, icon: Compass },
    { label: "Phone",              value: biz.phone, icon: Phone },
    { label: "Nearest Places",     value: nearbyNames, icon: MapPin },
  ].filter(f => f.value);

  return (
    <div className="dp-card">
      <p className="dp-card-eyebrow">Location</p>
      <p className="dp-card-address">{biz.location || "Location not available"}</p>

      <div
        className="dp-map-wrap"
        onClick={() => mapEmbedSrc && setExpanded(true)}
        style={{ cursor: mapEmbedSrc ? "pointer" : "default", position: "relative" }}
      >
        {mapEmbedSrc ? (
          <>
            <iframe
              title="location map"
              src={mapEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ pointerEvents: "none" }}
            />
            <div className="dp-map-expand-btn">
              <Maximize2 size={14} /> Expand
            </div>
          </>
        ) : (
          <div className="dp-map-placeholder">
            <MapPin size={22} />
            <span>Map unavailable</span>
          </div>
        )}
      </div>

      <div className="dp-map-actions">
        <a className="dp-map-btn primary" href={directionsUrl} target="_blank" rel="noreferrer">
          <Navigation size={14} /> Directions
        </a>
        <button className="dp-map-btn" onClick={onToggleSave}>
          <Bookmark size={14} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save Place"}
        </button>
      </div>

      {facts.length > 0 && (
        <>
          <div className="dp-card-divider" />
          <div className="dp-glance-list">
            {facts.map((f) => (
              <div className="dp-glance-row" key={f.label}>
                <f.icon size={16} className="dp-glance-icon" />
                <div>
                  <div className="dp-glance-label">{f.label}</div>
                  <div className="dp-glance-value">{f.value}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {expanded && (
        <MapModal
          biz={biz}
          mapEmbedSrc={mapEmbedSrc}
          directionsUrl={directionsUrl}
          onClose={() => setExpanded(false)}
          saved={saved}
          onToggleSave={onToggleSave}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GLIMPSES STRIP — horizontally scrolling photo strip with a
   floating nav arrow, opens the lightbox at the clicked photo.
══════════════════════════════════════════════════════════ */
function GlimpsesStrip({ name, images, onOpen }) {
  const scrollerRef = useRef(null);
  const isMobile = useIsMobile();

  if (!images.length) return null;

  const scrollBy = (dir) => {
    scrollerRef.current?.scrollBy({ left: dir * (isMobile ? 180 : 240), behavior: "smooth" });
  };

  return (
    <div>
      <p className="dp-section-eyebrow">Glimpses of {name}</p>
      <div style={{ position: "relative" }}>
        <div ref={scrollerRef} className="dp-glimpses-strip no-scrollbar">
          {images.map((img, i) => (
            <div
              key={i}
              className="dp-glimpse-thumb"
              style={{ backgroundImage: `url(${img})` }}
              onClick={() => onOpen(i)}
            />
          ))}
        </div>
        {!isMobile && images.length > 3 && (
          <button className="dp-glimpses-arrow" onClick={() => scrollBy(1)}>
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEWS — real visitor reviews for this place
══════════════════════════════════════════════════════════ */
function ReviewsSection({ businessId, categoryLabel }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const { reviews } = await getReviewsForBusiness(businessId);
      setReviews(reviews);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const markHelpful = async (id) => {
    // optimistic bump — matches the atomic $inc the server does
    setReviews(rs => rs.map(r => r._id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
    try {
      await markReviewHelpful(id);
    } catch {
      fetchReviews();
    }
  };

  return (
    <div style={{ marginTop: 48 }}>
      <p className="dp-section-eyebrow">Reviews</p>
      <h2 className="dp-section-title">
        {reviews.length > 0 ? `What visitors say about this ${categoryLabel.toLowerCase().replace(/s$/, "")}` : "Be the first to review"}
      </h2>

      {!loading && reviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 24 }}>
          {reviews.map(r => (
            <div key={r._id} style={{
              border: "1px solid rgba(26,31,28,0.08)", borderRadius: 16, padding: "20px 22px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                  {(r.city || r.country) && (
                    <div style={{ fontSize: 12, color: "#8a9e94", marginTop: 2 }}>
                      {[r.city, r.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
                <StarRating rating={r.rating} />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#333" }}>{r.comment}</p>
              {r.ownerReply?.text && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "#faf8f3", borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Reply from TruGoa</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{r.ownerReply.text}</div>
                </div>
              )}
              <button
                onClick={() => markHelpful(r._id)}
                style={{
                  marginTop: 12, background: "none", border: "1px solid rgba(26,31,28,0.15)",
                  borderRadius: 999, padding: "6px 14px", fontSize: 12, cursor: "pointer",
                }}
              >
                👍 Helpful{r.helpfulCount > 0 ? ` (${r.helpfulCount})` : ""}
              </button>
            </div>
          ))}
        </div>
      )}

      <ReviewForm businessId={businessId} fetchReviews={fetchReviews} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function DetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const contentRef = useRef(null);

  const [biz, setBiz] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [showSaveLogin, setShowSaveLogin] = useState(false);
  const { isTouristLoggedIn } = useTourist();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setStoryExpanded(false);
        const [bizData, allBiz] = await Promise.all([
          // Clean slug URLs are canonical; fall back to raw Mongo ID for old/shared links.
          getBusinessBySlug(slug).catch(() => getBusinessById(slug)),
          getBusinesses(),
        ]);
        const mapped = mapBusiness(bizData, 0);
        setBiz(mapped);

        if (isTouristLoggedIn) {
          getFavorites()
            .then(favs => setSaved(favs.some(f => String(f._id) === String(bizData._id))))
            .catch(() => {});
        }

        // If the URL didn't already use the canonical slug, swap it in for better SEO.
        if (mapped.slug && mapped.slug !== slug) {
          navigate(`/listings/${mapped.slug}`, { replace: true });
        }

        const sim = allBiz
          .filter(b => String(b._id) !== String(bizData._id) &&
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
  }, [slug]);

  if (loading) return (
    <div className="dp-loading">
      <div className="dp-loading-ring" />
      <p className="dp-loading-text">Loading…</p>
    </div>
  );

  if (error || !biz) return (
    <div className="dp-error">
      <div className="dp-error-icon">😕</div>
      <h2 className="dp-error-title">Place not found</h2>
      <button className="dp-btn-gold" onClick={() => navigate("/explore")}>
        Back to Explore
      </button>
    </div>
  );

  const images = biz.images?.length > 0 ? biz.images : (biz.image ? [biz.image] : []);
  const storyText = biz.story || biz.desc;
  const isLongStory = storyText.length > STORY_PREVIEW_LEN;
  const storyPreview = isLongStory && !storyExpanded
    ? storyText.slice(0, STORY_PREVIEW_LEN).trim() + "…"
    : storyText;

  const whyItems = (biz.highlights?.length ? biz.highlights : [
    "Natural beauty", "Local culture", "Things to do", "Great photography",
  ]).slice(0, 5);

  const categoryLabel = biz.category
    ? biz.category.charAt(0).toUpperCase() + biz.category.slice(1)
    : "Places";

  const heroHeadline = biz.tagline || biz.name;
  const heroDescription = biz.desc;
  const nearbyNames = similar.slice(0, 2).map(s => s.name).join(", ");

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFavorite = async () => {
    if (!isTouristLoggedIn) {
      setShowSaveLogin(true);
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    setSavingFavorite(true);
    try {
      if (next) await addFavorite(biz.id);
      else await removeFavorite(biz.id);
    } catch {
      setSaved(!next); // revert on failure
    } finally {
      setSavingFavorite(false);
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: biz.name,
    description: biz.desc,
    image: images,
    url: `${SITE_URL}/listings/${biz.slug || biz.id}`,
    address: biz.location ? { "@type": "PostalAddress", addressLocality: biz.location, addressRegion: "Goa", addressCountry: "IN" } : undefined,
    geo: biz.latitude && biz.longitude ? { "@type": "GeoCoordinates", latitude: biz.latitude, longitude: biz.longitude } : undefined,
    telephone: biz.phone || undefined,
    priceRange: biz.price || undefined,
    aggregateRating: biz.rating ? { "@type": "AggregateRating", ratingValue: biz.rating, reviewCount: biz.reviews || 1 } : undefined,
  };

  return (
    <div className="dp-root">
      <SEO
        path={`/listings/${biz.slug || biz.id}`}
        title={biz.name}
        description={(biz.desc || heroDescription || "").slice(0, 160) || `${biz.name} — ${biz.location || "Goa"}, verified on TruGoa.`}
        image={images[0]}
        type="place"
        jsonLd={jsonLd}
      />
      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <div className="dp-hero" style={{ height: isMobile ? 460 : 620 }}>
        {images.length > 0 ? (
          <div
            className="dp-hero-img"
            style={{ backgroundImage: `url(${images[0]})` }}
            onClick={() => setLightboxIdx(0)}
          />
        ) : (
          <div className="dp-gallery-placeholder">
            <span className="dp-gallery-emoji">📍</span>
          </div>
        )}
        <div className="dp-hero-veil" />

        {/* museum-plaque name tag, top-right */}
        {!isMobile && (
          <div className="dp-hero-plaque">
            <span>{biz.name}</span>
          </div>
        )}

        <div className="dp-hero-content">
          <div className="dp-hero-ctas">
            <button className="dp-hero-cta-primary" onClick={scrollToContent}>
              Explore {biz.name} <ChevronRight size={14} />
            </button>
            {images.length > 0 && (
              <button className="dp-hero-cta-secondary" onClick={() => setLightboxIdx(0)} aria-label="View gallery">
                <Camera size={16} />
              </button>
            )}
            {images.length > 0 && <span className="dp-hero-cta-label">View Gallery</span>}
          </div>

          <div className="dp-hero-stats">
            {biz.location && (
              <span><MapPin size={14} /> {biz.location}</span>
            )}
            <span><Clock size={14} /> {biz.visitDuration || categoryLabel}</span>
            <span><Sparkles size={14} /> {biz.highlights?.[0] || (biz.trust === "verified" ? "Locally Verified" : "Editorial Pick")}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════════ */}
      <div
        ref={contentRef}
        className="dp-content"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 340px" }}
      >
        <div className="dp-panel">
          {/* ── THE STORY ── */}
          <p className="dp-section-eyebrow">The Story</p>
          <h2 className="dp-section-title">
            {biz.name}
          </h2>

          <div className="dp-story-grid" style={{ gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr" }}>
            <div>
              <p className="dp-story-text">{storyPreview}</p>
              {isLongStory && (
                <button className="dp-readmore" onClick={() => setStoryExpanded(e => !e)}>
                  {storyExpanded ? "Read less" : "Read more"} <ChevronRight size={14} />
                </button>
              )}
            </div>
            {images[1] && (
              <div className="dp-story-img" style={{ backgroundImage: `url(${images[1]})` }} />
            )}
          </div>

          {biz.localTip && (
            <div className="dp-tip">
              <div className="dp-tip-icon">💡</div>
              <div>
                <div className="dp-tip-label">Local Insider Tip</div>
                <div className="dp-tip-text">{biz.localTip}</div>
              </div>
            </div>
          )}

          {/* ── GLIMPSES GALLERY ── */}
          {images.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <GlimpsesStrip name={biz.name} images={images} onOpen={(i) => setLightboxIdx(i)} />
            </div>
          )}

          {/* ── WHY YOU'LL LOVE IT ── */}
          <p className="dp-section-eyebrow" style={{ marginTop: 48 }}>Why You'll Love It</p>
          <div className="dp-why-grid">
            {whyItems.map((item, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
              return (
                <div className="dp-why-card" key={i}>
                  <Icon size={22} />
                  <span>{item}</span>
                </div>
              );
            })}
          </div>

          {/* ── EXPERIENCES (must-try list, if any) ── */}
          {biz.mustTry?.length > 0 && (
            <>
              <p className="dp-section-eyebrow" style={{ marginTop: 48 }}>Experiences</p>
              <h2 className="dp-section-title">Things to do here</h2>
              <div className="dp-why-grid" style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)" }}>
                {biz.mustTry.map((item, i) => {
                  const Icon = WHY_ICONS[i % WHY_ICONS.length];
                  return (
                    <div className="dp-why-card wide" key={i}>
                      <Icon size={20} />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── NEARBY PLACES ── */}
          {similar.length > 0 && (
            <>
              <p className="dp-section-eyebrow" style={{ marginTop: 48 }}>Nearby Places</p>
              <h2 className="dp-section-title">More {categoryLabel.toLowerCase()} close by</h2>
              <div className="dp-similar-grid" style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(2,1fr)" }}>
                {similar.map(s => (
                  <div key={s.id} className="dp-similar-card" onClick={() => navigate(`/listings/${s.slug || s.id}`)}>
                    <div
                      className="dp-similar-img"
                      style={{
                        backgroundImage: s.images?.[0] ? `url(${s.images[0]})` : undefined,
                        background: s.images?.[0] ? undefined : "#EDE8DD",
                      }}
                    />
                    <div className="dp-similar-body">
                      <p className="dp-similar-category">{s.category}</p>
                      <h3 className="dp-similar-name">{s.name}</h3>
                      <div className="dp-similar-meta">
                        <StarRating rating={s.rating} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── REVIEWS ── */}
          <ReviewsSection businessId={biz.id} categoryLabel={categoryLabel} />
        </div>

        {/* ── SIDEBAR ── */}
        <div className="dp-sidebar">
          <InfoCard biz={biz} nearbyNames={nearbyNames} saved={saved} onToggleSave={toggleFavorite} />
        </div>
      </div>

      {showSaveLogin && (
        <LoginModal
          onClose={() => setShowSaveLogin(false)}
          message="Sign in to save this place"
        />
      )}



      {/* ══════════════════════════════════════════════════
          LIGHTBOX
      ══════════════════════════════════════════════════ */}
      {lightboxIdx !== null && images.length > 0 && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
