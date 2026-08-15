import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Compass,
  Heart,
  MapPin,
  X,
} from "lucide-react";
import { CATEGORIES } from "../../constants/categories";
import { getBusinesses, getFavorites, addFavorite, removeFavorite } from "../../services/api";
import SEO from "../../components/SEO/SEO";
import { mapBusiness } from "../../services/mapper";
import { theme } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";
import { LoadingState, EmptyState, PrimaryButton } from "../../Theme";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../../components/LoginModal/LoginModal";

/* ─── filters ─── */
const isCategory = (b, list) => list.includes(b.category?.toLowerCase());
const hasTag = (b, tag) => b.tags?.includes(tag);

const EDITORS_PICK_FILTER = (b) =>
  hasTag(b, "editors-pick") || hasTag(b, "popular") || b.featured === true;

// Maps a ?category= key from the homepage shortcuts onto the Business records.
// One place stores several underlying category values (a "stay" may be saved as
// hotel/resort/homestay), so each key owns a predicate rather than a single
// string comparison. Keys must stay in sync with constants/categories.js.
const CATEGORY_FILTERS = {
  beaches:   (b) => isCategory(b, ["beach"]),
  food:      (b) => isCategory(b, ["restaurant", "cafe", "bakery"]) || hasTag(b, "food"),
  stays:     (b) => isCategory(b, ["hotel", "resort", "homestay", "stay"]),
  hidden:    (b) => hasTag(b, "hidden"),
  nightlife: (b) => isCategory(b, ["nightlife"]),
};

// exact pin if the business has one, otherwise falls back to lat/long, then a text search
const mapUrlFor = (b) =>
  b.googleMapUrl
  || (b.latitude && b.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`
    : b.area || b.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.area || b.location)}`
    : null);

/* ─── heritage / editorial accent — a warm antique gold, not the app's yellow ─── */
const HERITAGE_GOLD = "#B08A3E";

/* ══════════════════════════════════════════════════════
   SaveButton — heart toggle used on Explore cards
══════════════════════════════════════════════════════ */
function SaveButton({ saved, onClick, style }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={saved ? "Remove from saved places" : "Save this place"}
      style={{
        width: 34, height: 34, borderRadius: "50%", border: "none",
        background: "rgba(255,255,255,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        ...style,
      }}
    >
      <Heart
        size={16}
        strokeWidth={2}
        fill={saved ? "#C0392B" : "none"}
        color={saved ? "#C0392B" : theme.colors.textPrimary}
      />
    </button>
  );
}

/* ══════════════════════════════════════════════════════
   EditorPickCard — used in the 4-up "Editor's Picks" grid
══════════════════════════════════════════════════════ */
function EditorPickCard({ b, onOpen, saved, onToggleSave }) {
  return (
    <div onClick={() => onOpen(b)} style={{ cursor: "pointer" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          borderRadius: 10,
          overflow: "hidden",
          background: theme.colors.borderLight,
          marginBottom: 14,
        }}
      >
        <img
          src={b.image}
          alt={b.name}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <SaveButton
          saved={saved}
          onClick={() => onToggleSave(b)}
          style={{ position: "absolute", top: 10, right: 10 }}
        />
      </div>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 11,
          fontWeight: theme.typography.weightMedium,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: HERITAGE_GOLD,
        }}
      >
        {b.category}
      </p>
      <h4
        style={{
          margin: "0 0 12px",
          fontFamily: theme.typography.fontDisplay,
          fontSize: 18,
          fontWeight: theme.typography.weightBold,
          color: theme.colors.textPrimary,
          lineHeight: 1.3,
        }}
      >
        {b.name}
      </h4>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          fontWeight: theme.typography.weightMedium,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: theme.colors.textPrimary,
        }}
      >
        Read Story <ChevronRight size={13} strokeWidth={2} />
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   IntroScroller — the "Stays / Food & Drink / Hidden Gems"
   pattern: left intro column + a horizontally scrolling
   strip of images on the right, with nav arrow(s).

   captionStyle: "overlay" (dark gradient + white caps text
   on the image, used for Stays) or "below" (plain caption
   under the image, used for Food & Drink / Hidden Gems)

   arrows: "double" renders a muted left arrow + solid right
   arrow side by side (used for Stays, per the reference).
   "single" renders just the right arrow overlapping the
   edge of the last card (used for Food & Drink / Hidden Gems).
══════════════════════════════════════════════════════ */
function IntroScroller({
  title,
  description,
  exploreLabel,
  items,
  isMobile,
  onExplore,
  onOpen,
  captionStyle = "overlay",
  arrows = "single",
  favoriteIds,
  onToggleSave,
}) {
  const scrollerRef = useRef(null);

  const scrollBy = (dir) => {
    scrollerRef.current?.scrollBy({
      left: dir * (isMobile ? 240 : 340),
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  const arrowBtnStyle = (variant) => ({
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: variant === "muted" ? "1px solid #E5E1D8" : "1px solid #E5E5E5",
    background: variant === "muted" ? "#EDEAE3" : "white",
    color: variant === "muted" ? "#B9B3A6" : theme.colors.textPrimary,
    boxShadow: variant === "muted" ? "none" : "0 8px 30px rgba(0,0,0,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  });

  return (
    <div
      style={{
        padding: isMobile
          ? "0 16px 72px"
          : `0 ${theme.spacing.pagePadding} 96px`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT COLUMN */}
        <div
          style={{
            width: isMobile ? "100%" : 180,
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: isMobile ? 26 : 34,
              lineHeight: 1.1,
              marginBottom: 24,
              color: theme.colors.textPrimary,
              textTransform: "uppercase",
            }}
          >
            {title}
          </h2>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: theme.colors.textMuted,
              marginBottom: 28,
            }}
          >
            {description}
          </p>

          <button
            onClick={onExplore}
            style={{
              border: "none",
              background: "transparent",
              display: "flex",
              gap: 8,
              alignItems: "center",
              cursor: "pointer",
              padding: 0,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontBody,
            }}
          >
            {exploreLabel}
            <ChevronRight size={14} />
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            flex: 1,
            position: "relative",
            width: isMobile ? "100%" : undefined,
            minWidth: 0,
          }}
        >
          <div
            ref={scrollerRef}
            style={{
              display: "flex",
              gap: 18,
              overflowX: "auto",
              scrollbarWidth: "none",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              minWidth: 0,
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpen(item)}
                style={{
                  width: isMobile ? 240 : 320,
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                  cursor: "pointer",
                  transition: ".4s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px)";
                }}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1.45 / 1",
                    overflow: "hidden",
                    borderRadius: 14,
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform .5s ease",
                    }}
                  />

                  <SaveButton
                    saved={favoriteIds?.has(String(item.id))}
                    onClick={() => onToggleSave(item)}
                    style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}
                  />

                  {captionStyle === "overlay" && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,.75), transparent 60%)",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          bottom: 16,
                          left: 16,
                          color: "white",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".1em",
                        }}
                      >
                        {item.name}
                      </span>
                    </>
                  )}
                </div>

                {captionStyle === "below" && (
                  <>
                    <p
                      style={{
                        marginTop: 12,
                        marginBottom: 0,
                        fontSize: 13,
                        color: theme.colors.textPrimary,
                      }}
                    >
                      {item.name}
                    </p>
                    {(item.area || item.location) && (
                      mapUrlFor(item) ? (
                        <a
                          href={mapUrlFor(item)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            marginTop: 4,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 12,
                            color: theme.colors.textMuted,
                            textDecoration: "none",
                          }}
                        >
                          <MapPin size={11} strokeWidth={2} />
                          {item.area || item.location}
                        </a>
                      ) : (
                        <p
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            color: theme.colors.textMuted,
                          }}
                        >
                          {item.area || item.location}
                        </p>
                      )
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* NAV ARROW(S) */}
          {!isMobile && arrows === "double" && (
            <div
              style={{
                position: "absolute",
                right: 16,
                bottom: 16,
                display: "flex",
                gap: 10,
              }}
            >
              <button onClick={() => scrollBy(-1)} style={arrowBtnStyle("muted")}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => scrollBy(1)} style={arrowBtnStyle("solid")}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {!isMobile && arrows === "single" && (
            <button
              onClick={() => scrollBy(1)}
              style={{
                ...arrowBtnStyle("solid"),
                position: "absolute",
                right: 16,
                bottom: 16,
              }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ExplorePage
══════════════════════════════════════════════════════ */
const ExplorePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isTouristLoggedIn } = useTourist();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ?category=food narrows the list to that category. Derived straight from the
  // URL rather than mirrored into state, so a link, a back/forward step and an
  // in-page filter change can't disagree about what's showing. Unknown values
  // fall back to the unfiltered list instead of rendering an empty page.
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get("category");
  const activeCategory = CATEGORY_FILTERS[categoryKey] ? categoryKey : null;
  const activeCategoryMeta = CATEGORIES.find((c) => c.key === activeCategory);

  const setCategory = (key) => {
    if (key && CATEGORY_FILTERS[key]) setSearchParams({ category: key });
    else setSearchParams({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusinesses();
        const mapped = data.map((biz, i) => mapBusiness(biz, i));
        setBusinesses(mapped);
      } catch (err) {
        setError("Could not load places. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isTouristLoggedIn) {
      setFavoriteIds(new Set());
      return;
    }
    getFavorites()
      .then(favs => setFavoriteIds(new Set(favs.map(f => String(f._id)))))
      .catch(() => {});
  }, [isTouristLoggedIn]);

  const toggleSave = async (b) => {
    if (!isTouristLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    const id = String(b.id);
    const wasSaved = favoriteIds.has(id);

    // optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(id) : next.add(id);
      return next;
    });

    try {
      if (wasSaved) await removeFavorite(id);
      else await addFavorite(id);
    } catch {
      // revert on failure
      setFavoriteIds(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  const editorsPicks = businesses.filter(EDITORS_PICK_FILTER).slice(0, 4);

  // The grid shows every place by default and only the matching ones once a
  // category is picked — that narrowing is the whole point of the shortcuts.
  const visibleBusinesses = activeCategory
    ? businesses.filter(CATEGORY_FILTERS[activeCategory])
    : businesses;

  const nothingToShow = !businesses.length;

  return (
    <div style={{ fontFamily: theme.typography.fontBody, background: theme.colors.bgPage, minHeight: "100vh", overflowX: "hidden" }}>
      <SEO
        path="/explore"
        title="Explore Goa"
        description="Browse verified restaurants, cafes, stays, beaches and hidden gems across Goa — filtered by category, area and price, with honest local tips."
      />
      {/* ── HERO ─────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          minHeight: isMobile ? 480 : 620,
          padding: isMobile
            ? "48px 20px 40px"
            : `72px ${theme.spacing.pagePadding} 80px`,
          overflow: "hidden",
          background: "#0B0F12",
        }}
      >
        {/* BACKGROUND — image, shown in full (not cropped) */}
        <img
          src="/images/Explore-hero.jpg"
          alt="Palm trees along a rocky Goa coastline"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "110%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.25) 55%, rgba(0,0,0,.05) 100%)",
            zIndex: 1,
          }}
        />

        {/* COPY — over the image */}
        <div style={{ position: "relative", zIndex: 2, flex: isMobile ? "unset" : "0 0 42%", minWidth: 0 }}>
          <p
            style={{
              fontSize: 12,
              marginTop:"18%",
              paddingTop:4,
              fontWeight: theme.typography.weightMedium,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: HERITAGE_GOLD,
              margin: "0 0 18px",
            }}
          >
            Explore Goa
          </p>

          <h1
            style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: isMobile ? "clamp(30px,8vw,40px)" : "clamp(38px,3.4vw,54px)",
              fontWeight: theme.typography.weightBold,
              color: "#FFFFFF",
              lineHeight: 1.15,
              margin: "0 0 20px",
            }}
          >
            Beyond the beaches,
            <br />
            the real Goa.
          </h1>

          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.85)",
              margin: "0 0 32px",
              maxWidth: 420,
            }}
          >
            A curated guide to the places, people and experiences that make
            Goa unforgettable.
          </p>

      
        </div>
      </div>

      {/* ── STATE HANDLING ───────────────────────────── */}
      {loading && (
        <div style={{ padding: isMobile ? "24px 16px" : `40px ${theme.spacing.pagePadding}` }}>
          <LoadingState message="Loading Goa's best-kept secrets..." />
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: "center", padding: "60px 16px" }}>
          <div
            style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 19,
              fontWeight: theme.typography.weightBold,
              color: theme.colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Something went wrong
          </div>
          <div style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 20 }}>{error}</div>
          <PrimaryButton onClick={() => window.location.reload()}>Try Again</PrimaryButton>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── EDITOR'S PICKS — hidden while a category is active, since
                 its picks span every category and would contradict the
                 filter the user just applied ── */}
          {!activeCategory && editorsPicks.length > 0 && (
            <div
              style={{
                padding: isMobile ? "32px 16px" : `48px ${theme.spacing.pagePadding}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 11,
                      fontWeight: theme.typography.weightMedium,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: HERITAGE_GOLD,
                    }}
                  >
                    Editor's Picks
                  </p>
                  <h2
                    style={{
                      fontFamily: theme.typography.fontDisplay,
                      fontSize: isMobile ? 24 : 30,
                      fontWeight: theme.typography.weightBold,
                      color: theme.colors.textPrimary,
                      margin: 0,
                    }}
                  >
                    Handpicked, just for you.
                  </h2>
                </div>
                {/* {!isMobile && (
                  // <button
                  //   onClick={() => navigate("/explore")}
                  //   style={{
                  //     display: "flex",
                  //     alignItems: "center",
                  //     gap: 4,
                  //     background: "none",
                  //     border: "none",
                  //     cursor: "pointer",
                  //     fontSize: 12,
                  //     fontWeight: theme.typography.weightMedium,
                  //     letterSpacing: "0.06em",
                  //     textTransform: "uppercase",
                  //     color: theme.colors.textPrimary,
                  //     fontFamily: theme.typography.fontBody,
                  //     whiteSpace: "nowrap",
                  //   }}
                  // >
                  //   View All Picks <ChevronRight size={13} strokeWidth={2} />
                  // </button>
                )} */}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                  gap: isMobile ? 16 : 26,
                }}
              >
                {editorsPicks.map((b) => (
                  <EditorPickCard
                    key={b.id}
                    b={b}
                    onOpen={(b) => navigate(`/listings/${b.slug || b.id}`)}
                    saved={favoriteIds.has(String(b.id))}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── PLACES (filtered by ?category=) ───────── */}
          {businesses.length > 0 && (
            <div
              style={{
                padding: isMobile ? "8px 16px 40px" : `8px ${theme.spacing.pagePadding} 56px`,
              }}
            >
              {/* Filter chips — also the way back to the full list, so a
                  visitor arriving on a filtered link is never stuck in it. */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  paddingBottom: 4,
                  marginBottom: isMobile ? 18 : 24,
                }}
              >
                {[{ key: null, label: "All" }, ...CATEGORIES.filter((c) => c.key !== "all")].map((c) => {
                  const isOn = activeCategory === c.key || (!activeCategory && c.key === null);
                  return (
                    <button
                      key={c.key ?? "all"}
                      onClick={() => setCategory(c.key)}
                      aria-pressed={isOn}
                      style={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        minHeight: 40,
                        padding: "9px 16px",
                        borderRadius: theme.radii.pill,
                        border: `1.5px solid ${isOn ? theme.colors.secondary : theme.colors.borderLight}`,
                        background: isOn ? theme.colors.secondary : theme.colors.bgCard,
                        color: isOn ? theme.colors.textInverse : theme.colors.textBody,
                        fontFamily: theme.typography.fontBody,
                        fontSize: 13,
                        fontWeight: isOn
                          ? theme.typography.weightMedium
                          : theme.typography.weightRegular,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: theme.transitions.fast,
                      }}
                    >
                      {c.label}
                      {isOn && c.key && <X size={13} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  fontFamily: theme.typography.fontDisplay,
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: theme.typography.weightBold,
                  color: theme.colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                {activeCategoryMeta ? activeCategoryMeta.label : "All Places"}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: theme.colors.textMuted,
                  marginBottom: isMobile ? 20 : 28,
                }}
              >
                {visibleBusinesses.length} verified{" "}
                {visibleBusinesses.length === 1 ? "place" : "places"}
                {activeCategoryMeta ? ` · ${activeCategoryMeta.sub}` : " across Goa."}
              </div>

              {visibleBusinesses.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                    gap: isMobile ? 16 : 26,
                  }}
                >
                  {visibleBusinesses.map((b) => (
                    <EditorPickCard
                      key={b.id}
                      b={b}
                      onOpen={(b) => navigate(`/listings/${b.slug || b.id}`)}
                      saved={favoriteIds.has(String(b.id))}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              ) : (
                // The catalogue has places, just none in this category — say so
                // rather than showing a bare empty grid.
                <EmptyState
                  icon="🔍"
                  title={`No ${activeCategoryMeta?.label.toLowerCase() || "places"} yet`}
                  subtitle="We haven't verified anything in this category so far. Try another one."
                  action={<PrimaryButton onClick={() => setCategory(null)}>Show all places</PrimaryButton>}
                />
              )}
            </div>
          )}

          {/* ── EMPTY STATE, if there are no places at all ── */}
          {nothingToShow && (
            <div style={{ padding: isMobile ? "0 16px 60px" : `0 ${theme.spacing.pagePadding} 60px` }}>
              <EmptyState
                icon="🗺️"
                title="No places yet"
                subtitle="There are no approved places to show right now. Add some from the admin dashboard and they'll appear here."
                action={<PrimaryButton onClick={() => navigate("/")}>Back to home</PrimaryButton>}
              />
            </div>
          )}

          {/* ── AI GUIDE CTA BANNER ───────────────────── */}
          <div
            style={{
              margin: isMobile ? "8px 16px 40px" : `8px ${theme.spacing.pagePadding} 56px`,
              background: theme.colors.bgSection || "#ECE7DE",
              borderRadius: 18,
              overflow: "hidden",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              padding: isMobile ? "28px 20px" : "0 0 0 48px",
            }}
          >
            <div style={{ flex: "1 1 380px" }}>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 11,
                    fontWeight: theme.typography.weightMedium,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    color: HERITAGE_GOLD,
                  }}
                >
                  Not sure where to start?
                </p>
                <h2
                  style={{
                    fontFamily: theme.typography.fontDisplay,
                    fontSize: isMobile ? 22 : 26,
                    fontWeight: theme.typography.weightBold,
                    color: theme.colors.textPrimary,
                    lineHeight: 1.25,
                    margin: "0 0 22px",
                    maxWidth: 340,
                  }}
                >
                  Let our AI Guide plan your perfect Goa trip.
                </h2>
                <button
                  onClick={() => navigate("/goaguide")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: theme.colors.textPrimary,
                    color: "white",
                    border: "none",
                    borderRadius: theme.radii.pill,
                    padding: "13px 22px",
                    fontSize: 12,
                    fontWeight: theme.typography.weightMedium,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Ask GoaGuide AI <ChevronRight size={14} strokeWidth={2} />
                </button>
              </div>

              {!isMobile && (
                <div style={{ flex: "1 1 320px", alignSelf: "stretch", position: "relative", minHeight: 220 }}>
                  <img
                    src="https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=900&q=80"
                    alt="Goan heritage church surrounded by palms"
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                  />
                </div>
              )}
          </div>
        </>
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          message="Sign in to save this place"
        />
      )}
    </div>
  );
};

export default ExplorePage;