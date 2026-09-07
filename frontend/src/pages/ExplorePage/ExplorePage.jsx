import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Compass,
  Heart,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";
import { CATEGORIES } from "../../constants/categories";
import { getBusinesses, getFavorites, addFavorite, removeFavorite } from "../../services/api";
import SEO from "../../components/SEO/SEO";
import OpenBadge from "../../components/OpenBadge/OpenBadge";
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
// What each shortcut asks the API for. These mirror CATEGORY_FILTERS below
// exactly, but run in the query rather than in the browser: the page used to
// download the whole catalogue and filter it here, which grows linearly with
// the number of listings. `category` is comma-separated and OR-ed with `tag`
// server-side, so a key can span several stored categories, a tag, or both.
const CATEGORY_QUERIES = {
  beaches:      { category: "beach" },
  food:         { category: "restaurant,cafe,bakery", tag: "food" },
  // Narrower slices of "food" — for links (the homepage category tiles) that
  // want cafés or restaurants specifically rather than the combined row.
  cafe:         { category: "cafe" },
  restaurant:   { category: "restaurant" },
  stays:        { category: "hotel,resort,homestay,stay" },
  hidden:       { tag: "hidden" },
  nightlife:    { category: "nightlife" },
  sacredPlaces: { category: "spiritual" },
  art:          { category: "art-gallery" },
  museum:       { category: "museum" },
  library:      { category: "library" },
};

// How many cards a page of the grid holds.
const PAGE_SIZE = 12;

// Full page-number list for small totals, or a windowed 1 … n-1, n, n+1 … last
// for big ones — never a wall of buttons.
const paginationRange = (current, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const keep = new Set([1, 2, totalPages - 1, totalPages, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const withGaps = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) withGaps.push("gap");
    withGaps.push(p);
    prev = p;
  }
  return withGaps;
};

// Shared look for the Prev/Next arrows and the page-number buttons — coral
// fill on the active page, everything else a plain outline.
const pagerBtnStyle = ({ active = false, disabled = false } = {}) => ({
  minWidth: 36,
  height: 36,
  padding: "0 10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  border: `1.5px solid ${active ? theme.colors.accent : theme.colors.borderLight}`,
  background: active ? theme.colors.accent : theme.colors.bgCard,
  color: active ? theme.colors.textInverse : theme.colors.textPrimary,
  fontFamily: theme.typography.fontBody,
  fontSize: 13,
  fontWeight: active ? theme.typography.weightBold : theme.typography.weightMedium,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.4 : 1,
  transition: theme.transitions.fast,
});

// Still used for the Editor's Picks row, which is drawn from the cards
// already loaded rather than costing a request of its own — the API sorts
// editorPick and featured first, so they land on the first page.
const CATEGORY_FILTERS = {
  beaches:   (b) => isCategory(b, ["beach"]),
  food:      (b) => isCategory(b, ["restaurant", "cafe", "bakery"]) || hasTag(b, "food"),
  cafe:        (b) => isCategory(b, ["cafe"]),
  restaurant:  (b) => isCategory(b, ["restaurant"]),
  stays:     (b) => isCategory(b, ["hotel", "resort", "homestay", "stay"]),
  hidden:    (b) => hasTag(b, "hidden"),
  nightlife: (b) => isCategory(b, ["nightlife"]),
  sacredPlaces:   (b) => isCategory(b, ["spiritual"]),
  art:       (b) => isCategory(b, ["art-gallery"]),
  museum:  (b) => isCategory(b, ["museum"]),
  library: (b) => isCategory(b, ["library"]),
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
  const isClosed = b.openStatus === "closed";
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
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            // Closed places aren't hidden when "show all" is on — just visibly
            // dimmed so the row still reads as "these are shut right now".
            filter: isClosed ? "grayscale(0.5) brightness(0.82)" : "none",
          }}
        />
        <span style={{ position: "absolute", left: 10, bottom: 10, zIndex: 2 }}>
          <OpenBadge place={b} variant="onImage" />
        </span>
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
          color: theme.colors.accent,
        }}
      >
        {b.category}
      </p>
      <h4
        style={{
          margin: "0 0 6px",
          fontFamily: theme.typography.fontDisplay,
          fontSize: 18,
          fontWeight: theme.typography.weightBold,
          color: theme.colors.textPrimary,
          lineHeight: 1.3,
        }}
      >
        {b.name}
      </h4>
      {EDITORS_PICK_FILTER(b) && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            margin: "0 0 10px",
            fontSize: 11,
            fontWeight: theme.typography.weightMedium,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: theme.colors.textMuted,
          }}
        >
          <Check size={12} strokeWidth={2.5} color={theme.colors.secondaryDark} />
          Picked by a local
        </p>
      )}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          fontWeight: theme.typography.weightMedium,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: theme.colors.accent,
        }}
      >
        Read the story <ChevronRight size={13} strokeWidth={2} />
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
   FilterMenu — single "Filters" button that opens a small
   popover holding every list option (open/closed scope and
   price ordering). Closes on outside-click or Escape.
══════════════════════════════════════════════════════ */
function FilterMenu({ showAll, onToggleShowAll, priceLowToHigh, onTogglePrice }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const activeCount = (showAll ? 1 : 0) + (priceLowToHigh ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const row = (checked, label, onClick) => (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 12px",
        border: "none",
        borderRadius: 8,
        background: "transparent",
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.fontBody,
        fontSize: 13.5,
        fontWeight: theme.typography.weightMedium,
        textAlign: "left",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.bgPage)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          borderRadius: 5,
          border: `1.5px solid ${checked ? theme.colors.secondary : theme.colors.borderLight}`,
          background: checked ? theme.colors.secondary : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Check size={12} strokeWidth={3} color={theme.colors.textInverse} />}
      </span>
      {label}
    </button>
  );

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          minHeight: 34,
          padding: "6px 14px",
          borderRadius: theme.radii.pill,
          border: `1.5px solid ${activeCount ? theme.colors.secondary : theme.colors.borderLight}`,
          background: activeCount ? theme.colors.secondary : theme.colors.bgCard,
          color: activeCount ? theme.colors.textInverse : theme.colors.textBody,
          fontFamily: theme.typography.fontBody,
          fontSize: 12.5,
          fontWeight: theme.typography.weightMedium,
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: theme.transitions.fast,
        }}
      >
        <SlidersHorizontal size={14} strokeWidth={2} />
        Filters{activeCount ? ` · ${activeCount}` : ""}
        <ChevronDown size={14} strokeWidth={2} style={{ transform: open ? "rotate(180deg)" : "none", transition: theme.transitions.fast }} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 20,
            width: 264,
            padding: 8,
            borderRadius: 12,
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.borderLight}`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
          }}
        >
          <p
            style={{
              margin: "6px 12px 8px",
              fontSize: 10.5,
              fontWeight: theme.typography.weightBold,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: theme.colors.textMuted,
            }}
          >
            Availability
          </p>
          {row(showAll, "Show all (incl. closed)", onToggleShowAll)}
          <p
            style={{
              margin: "12px 12px 8px",
              fontSize: 10.5,
              fontWeight: theme.typography.weightBold,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: theme.colors.textMuted,
            }}
          >
            Sort by
          </p>
          {row(priceLowToHigh, "Price: Low to High", onTogglePrice)}

          {activeCount > 0 && (
            <>
              <div style={{ height: 1, background: theme.colors.borderLight, margin: "8px 4px" }} />
              <button
                type="button"
                onClick={() => {
                  if (showAll) onToggleShowAll();
                  if (priceLowToHigh) onTogglePrice();
                }}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: 8,
                  background: "transparent",
                  color: theme.colors.accent,
                  fontFamily: theme.typography.fontBody,
                  fontSize: 12.5,
                  fontWeight: theme.typography.weightBold,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      )}
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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Category pages default to places open right now; this reveals the closed
  // ones too (dimmed, badged) for people planning ahead for tomorrow.
  const [showAll, setShowAll] = useState(false);
  // Reorders the grid cheapest-first (by priceLevel). Off by default, which
  // keeps the editor's-pick ordering the API returns.
  const [priceLowToHigh, setPriceLowToHigh] = useState(false);

  // ?category=food narrows the list to that category. Derived straight from the
  // URL rather than mirrored into state, so a link, a back/forward step and an
  // in-page filter change can't disagree about what's showing. Unknown values
  // fall back to the unfiltered list instead of rendering an empty page.
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get("category");
  const activeCategory = CATEGORY_FILTERS[categoryKey] ? categoryKey : null;
  // "cafe" and "restaurant" are narrower slices of the "food" pill — they
  // don't get a pill of their own in CATEGORIES, but still need a heading
  // when linked to directly, e.g. from the homepage's category tiles.
  const activeCategoryMeta =
    CATEGORIES.find((c) => c.key === activeCategory) ||
    { cafe: { label: "Cafés", sub: "Coffee, bakes and slow mornings" },
      restaurant: { label: "Restaurants", sub: "Kitchens worth the trip" } }[activeCategory];

  const setCategory = (key) => {
    if (key && CATEGORY_FILTERS[key]) setSearchParams({ category: key });
    else setSearchParams({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Switching category or the open/closed toggle invalidates whatever page
  // we were on — a filter with fewer results might not even have a page 3.
  useEffect(() => {
    setPage(1);
  }, [activeCategory, showAll, priceLowToHigh]);

  // Refetches this exact page whenever the category, toggle or page number
  // changes — the narrowing happens in the query, so each page is its own
  // request rather than one big local array sliced client-side.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { items, total: found } = await getBusinesses({
          ...(CATEGORY_QUERIES[activeCategory] || {}),
          openNow: showAll ? false : undefined,
          sort: priceLowToHigh ? "price_asc" : undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setBusinesses(items.map((biz, i) => mapBusiness(biz, i)));
        setTotal(found ?? items.length);
      } catch (err) {
        if (!cancelled) setError("Could not load places. Please check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCategory, showAll, priceLowToHigh, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (clamped === page) return;
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!isTouristLoggedIn) {
      setFavoriteIds(new Set());
      return;
    }
    let cancelled = false;
    getFavorites()
      .then(favs => { if (!cancelled) setFavoriteIds(new Set(favs.map(f => String(f._id)))); })
      .catch(() => {});
    return () => { cancelled = true; };
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

  // Already narrowed by the query — CATEGORY_QUERIES reproduces what
  // CATEGORY_FILTERS used to compute here.
  const visibleBusinesses = businesses;

  // "Nothing at all" and "nothing open right now" need different words — the
  // latter isn't an empty catalogue, it's a time of day.
  const nothingToShow = !businesses.length && showAll;
  const nothingOpenNow = !businesses.length && !showAll;

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
          background: theme.colors.bgPage,
          padding: isMobile
            ? "40px 20px 28px"
            : `64px ${theme.spacing.pagePadding} 40px`,
        }}
      >
        <p
          style={{
            fontSize: 11.5,
            fontWeight: theme.typography.weightBold,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: theme.colors.accent,
            margin: "0 0 10px",
          }}
        >
          Goa &middot; Curated by locals
        </p>

        <h1
          style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: isMobile ? "clamp(28px,8vw,36px)" : "clamp(34px,3.2vw,46px)",
            fontWeight: theme.typography.weightBold,
            color: theme.colors.textPrimary,
            lineHeight: 1.15,
            margin: "0 0 12px",
          }}
        >
          Featured places in Goa
        </h1>

        <p
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: theme.colors.textMuted,
            margin: "0 0 24px",
            maxWidth: 460,
          }}
        >
          Places we love. Not sponsored, ever.
        </p>

        <div
          style={{
            borderTop: `1px solid ${theme.colors.borderLight}`,
            margin: "0 0 24px",
          }}
        />

        {/* Category pills — the primary way to filter the grid below. Single
            scrollable row rather than wrapping, so it never breaks into a
            ragged grid on narrower screens. */}
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            overflowX: "auto",
            scrollbarWidth: "none",
            gap: 10,
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
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: `1.5px solid ${isOn ? theme.colors.textPrimary : theme.colors.borderLight}`,
                  background: isOn ? theme.colors.textPrimary : "transparent",
                  color: isOn ? theme.colors.textInverse : theme.colors.textPrimary,
                  fontFamily: theme.typography.fontBody,
                  fontSize: 13,
                  fontWeight: isOn ? theme.typography.weightBold : theme.typography.weightMedium,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: theme.transitions.fast,
                }}
              >
                {c.label}
              </button>
            );
          })}
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
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                  color: theme.colors.textMuted,
                  marginBottom: isMobile ? 20 : 28,
                }}
              >
                <span>
                  {total} {showAll ? "verified" : "open"}{" "}
                  {total === 1 ? "place" : "places"}
                  {showAll
                    ? (activeCategoryMeta ? ` · ${activeCategoryMeta.sub}` : " across Goa.")
                    : " right now"}
                </span>
                <FilterMenu
                  showAll={showAll}
                  onToggleShowAll={() => setShowAll((v) => !v)}
                  priceLowToHigh={priceLowToHigh}
                  onTogglePrice={() => setPriceLowToHigh((v) => !v)}
                />
              </div>

              {visibleBusinesses.length > 0 ? (
                <>
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

                {/* Each page is its own request (12 at a time), so a huge
                    category never ships the whole catalogue up front. */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: isMobile ? 28 : 40,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 1}
                      aria-label="Previous page"
                      style={pagerBtnStyle({ disabled: page === 1 })}
                    >
                      <ChevronLeft size={16} strokeWidth={2} />
                    </button>

                    {paginationRange(page, totalPages).map((p, i) =>
                      p === "gap" ? (
                        <span
                          key={`gap-${i}`}
                          style={{ padding: "0 4px", color: theme.colors.textMuted, fontSize: 13 }}
                        >
                          &hellip;
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => goToPage(p)}
                          aria-current={p === page ? "page" : undefined}
                          style={pagerBtnStyle({ active: p === page })}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => goToPage(page + 1)}
                      disabled={page === totalPages}
                      aria-label="Next page"
                      style={pagerBtnStyle({ disabled: page === totalPages })}
                    >
                      <ChevronRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                )}
                </>
              ) : !showAll ? (
                // Filtered to open-now and nothing's open — the closed ones are
                // still there, one tap away.
                <EmptyState
                  icon="🌙"
                  title={`Nothing ${activeCategoryMeta?.label.toLowerCase() || "here"} open right now`}
                  subtitle="Everything in this category is closed at the moment. You can still browse them to plan ahead."
                  action={<PrimaryButton onClick={() => setShowAll(true)}>Show all (incl. closed)</PrimaryButton>}
                />
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

          {/* ── NOTHING OPEN RIGHT NOW — the catalogue has places, they're just
                 all closed at this hour ── */}
          {nothingOpenNow && (
            <div style={{ padding: isMobile ? "0 16px 60px" : `0 ${theme.spacing.pagePadding} 60px` }}>
              <EmptyState
                icon="🌙"
                title={`Nothing ${activeCategoryMeta ? activeCategoryMeta.label.toLowerCase() : "here"} is open right now`}
                subtitle="Everything is closed at the moment. Browse the full list to plan for tomorrow."
                action={<PrimaryButton onClick={() => setShowAll(true)}>Show all (incl. closed)</PrimaryButton>}
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