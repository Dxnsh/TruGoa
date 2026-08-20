import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, X, Info, MapPin, Star, Loader2, Compass,
  RotateCcw, ArrowLeft, Sparkles, Palmtree, Coffee, UtensilsCrossed,
  BedDouble, Martini, Landmark, ShoppingBag, SlidersHorizontal, Check,
} from "lucide-react";
import { getNearbyBusinesses, addFavorite } from "../../services/api";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../LoginModal/LoginModal";
import "./DiscoverSwipe.css";

// Approximate centroids used when the browser won't give us a real fix.
// Coordinates are [lat, lng] here and flipped to GeoJSON order inside the API layer.
const REGION_CENTRES = {
  "north-goa": { lat: 15.5937, lng: 73.7554, label: "North Goa" },
  "south-goa": { lat: 15.0100, lng: 74.0200, label: "South Goa" },
};

// What you're in the mood for. `category` is sent straight to
// /businesses/nearby, which filters inside $geoNear — so the deck is narrowed
// by the database, not by discarding cards after they arrive. Values must be
// Business.category enum members; a mood spanning several of them passes a
// comma-separated list.
const MOODS = [
  { key: "all",       label: "All",          category: null,         Icon: Sparkles },
  { key: "beach",     label: "Beaches",      category: "beach",      Icon: Palmtree },
  { key: "cafe",      label: "Cafés",        category: "cafe",       Icon: Coffee },
  { key: "food",      label: "Food",         category: "restaurant", Icon: UtensilsCrossed },
  { key: "stay",      label: "Stays",        category: "hotel,stay", Icon: BedDouble },
  { key: "nightlife", label: "Nightlife",    category: "nightlife",  Icon: Martini },
  { key: "heritage",  label: "Heritage",     category: "heritage",   Icon: Landmark },
  { key: "market",    label: "Markets",      category: "market",     Icon: ShoppingBag },
  { key: "activity",  label: "Things to do", category: "activity",   Icon: Compass },
];

const categoryFor = (key) => MOODS.find((m) => m.key === key)?.category ?? null;
const labelFor    = (key) => MOODS.find((m) => m.key === key)?.label ?? "places";

// Past this many pixels of horizontal travel, releasing commits the swipe
// instead of snapping the card back to centre.
const SWIPE_COMMIT_PX = 110;

// A press that travels less than this in any direction counts as a tap rather
// than a swipe. Fingers drift a few pixels on even a deliberate tap, so this
// can't be zero.
const TAP_SLOP_PX = 10;

// Waiting on a position fix is what actually makes the deck feel slow — the
// query behind it takes a few hundred ms, while acquiring a location can take
// seconds (or the whole timeout, if the permission prompt goes unanswered).
// Remembering the last one for the session means every visit after the first
// starts fetching immediately instead of locating first.
const ORIGIN_KEY = "trugoa_discover_origin";
const ORIGIN_TTL_MS = 30 * 60 * 1000;

const readStoredOrigin = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(ORIGIN_KEY) || "null");
    if (!stored || typeof stored.lat !== "number" || typeof stored.lng !== "number") return null;
    if (Date.now() - stored.at > ORIGIN_TTL_MS) return null;
    return stored;
  } catch {
    return null; // private mode, or someone hand-edited the value
  }
};

const storeOrigin = (lat, lng, label) => {
  try {
    sessionStorage.setItem(ORIGIN_KEY, JSON.stringify({ lat, lng, label, at: Date.now() }));
  } catch {
    /* storage unavailable — we just locate again next time */
  }
};

const formatDistance = (metres) => {
  if (typeof metres !== "number") return null;
  return metres < 1000
    ? `${Math.round(metres)} m away`
    : `${(metres / 1000).toFixed(1)} km away`;
};

// How wide the backend had to look before it found anything. Only the
// "nearby" tier is ranked by proximity and carries a distance, so the other
// two say where the results actually come from rather than leaving the card
// implying a place is round the corner when it may be an hour's drive.
const SCOPE_NOTE = {
  region: "In your part of Goa",
  goa: "Across Goa",
};

const DiscoverSwipe = () => {
  const navigate = useNavigate();
  const { isTouristLoggedIn } = useTourist();

  const [places, setPlaces]   = useState([]);
  const [index, setIndex]     = useState(0);
  // locating | loading | ready | denied | error.
  // Browsers without the Geolocation API start straight on the region picker
  // rather than showing a spinner that could never resolve.
  const [status, setStatus]   = useState(
    () => ("geolocation" in navigator ? "locating" : "denied")
  );
  const [savedCount, setSavedCount] = useState(0);
  const [showInfo, setShowInfo]     = useState(false);
  const [showLogin, setShowLogin]   = useState(false);
  const [mood, setMood] = useState("all");
  // "nearby" | "region" | "goa" — how far the backend had to widen to fill the
  // deck. Drives the caption on each card and the copy on the empty state.
  const [scope, setScope] = useState("nearby");
  // Re-filtering keeps the shell (and the mood chips) on screen, so it gets
  // its own flag rather than dropping back to the full-page "loading" status.
  const [refetching, setRefetching] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  // Wherever the deck is currently centred, so switching mood can re-query
  // the same spot without asking the browser for a fix again.
  const origin = useRef(null);

  // Close the filter menu on any tap outside it.
  useEffect(() => {
    if (!showFilter) return;
    const handler = (e) => {
      if (!e.target.closest("[data-ds-filter]")) setShowFilter(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [showFilter]);

  // Drag state lives in a ref so pointermove doesn't re-render on every frame;
  // the visible transform is written straight to the node instead.
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 });
  const cardRef = useRef(null);
  const [flyOut, setFlyOut] = useState(null); // "left" | "right" | null

  const current = places[index];
  const hasMore = index < places.length;

  // ── Fetching ───────────────────────────────────────────────────────────────
  const loadNearby = useCallback(async (lat, lng, label, category = null) => {
    origin.current = { lat, lng, label };
    storeOrigin(lat, lng, label);
    setStatus("loading");
    try {
      const { scope: resultScope, places: results } = await getNearbyBusinesses({
        lat, lng, maxDistance: 15000, limit: 20, category,
      });
      setPlaces(results);
      setScope(resultScope);
      setIndex(0);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  // Switching mood re-queries the same coordinates with a new category.
  const applyMood = useCallback(async (key) => {
    setMood(key);
    setShowFilter(false);
    const at = origin.current;
    if (!at) return;

    setRefetching(true);
    try {
      const { scope: resultScope, places: results } = await getNearbyBusinesses({
        lat: at.lat,
        lng: at.lng,
        maxDistance: 15000,
        limit: 20,
        category: categoryFor(key),
      });
      setPlaces(results);
      setScope(resultScope);
      setIndex(0);
      setShowInfo(false);
    } catch {
      setStatus("error");
    } finally {
      setRefetching(false);
    }
  }, []);

  // ── Geolocation on mount ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Been here already this session — skip locating and fetch straight away.
    const remembered = readStoredOrigin();
    if (remembered) {
      loadNearby(remembered.lat, remembered.lng, remembered.label);
      return () => { cancelled = true; };
    }

    if (!("geolocation" in navigator)) return; // already parked on the picker

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        loadNearby(pos.coords.latitude, pos.coords.longitude, "Near you");
      },
      () => {
        // Covers denial, timeout and position-unavailable alike — in every
        // case the user still needs a way through, so we show the region picker
        // rather than an error dead end.
        if (!cancelled) setStatus("denied");
      },
      // 5s, not 8: past a few seconds a fix usually isn't coming, and the
      // region picker gets people moving sooner than a longer spinner does.
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );

    return () => { cancelled = true; };
  }, [loadNearby]);

  // ── Advancing the deck ─────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setShowInfo(false);
    setFlyOut(null);
    drag.current = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };
    if (cardRef.current) cardRef.current.style.transform = "";
    setIndex((i) => i + 1);
  }, []);

  const commitSwipe = useCallback((direction, place) => {
    setFlyOut(direction);

    if (direction === "right" && place) {
      // Optimistic: the card leaves immediately and the count ticks up, so a
      // slow network never stalls the deck. A failed save is surfaced by the
      // place simply not appearing in /saved rather than blocking the swipe.
      setSavedCount((c) => c + 1);
      addFavorite(place._id).catch(() => {
        setSavedCount((c) => Math.max(0, c - 1));
      });
    }

    // Matches the .ds-card--out animation duration in the stylesheet.
    setTimeout(advance, 280);
  }, [advance]);

  const handleAction = useCallback((direction) => {
    if (!current || flyOut) return;
    if (direction === "right" && !isTouristLoggedIn) {
      setShowLogin(true);
      return;
    }
    commitSwipe(direction, current);
  }, [current, flyOut, isTouristLoggedIn, commitSwipe]);

  // ── Pointer-driven swiping ─────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (flyOut || showInfo) return;
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;
    if (cardRef.current) {
      // Rotation is tied to travel so the card pivots like a physical one.
      cardRef.current.style.transform =
        `translate(${d.dx}px, ${d.dy * 0.25}px) rotate(${d.dx * 0.045}deg)`;
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;

    // Barely moved — that's a tap on the card, so open the full place page.
    if (Math.abs(d.dx) < TAP_SLOP_PX && Math.abs(d.dy) < TAP_SLOP_PX) {
      if (cardRef.current) cardRef.current.style.transform = "";
      openCurrent();
      return;
    }

    if (Math.abs(d.dx) > SWIPE_COMMIT_PX) {
      const direction = d.dx > 0 ? "right" : "left";
      if (direction === "right" && !isTouristLoggedIn) {
        if (cardRef.current) cardRef.current.style.transform = "";
        setShowLogin(true);
        return;
      }
      commitSwipe(direction, current);
      return;
    }

    // Under the threshold — spring back to centre.
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.25s cubic-bezier(0.18,0.89,0.32,1.28)";
      cardRef.current.style.transform = "";
      setTimeout(() => {
        if (cardRef.current) cardRef.current.style.transition = "";
      }, 250);
    }
  };

  const restart = () => { setIndex(0); setSavedCount(0); };

  // Slug URLs are canonical, but DetailPage falls back to an ID lookup, so
  // a place without one still opens.
  const openCurrent = useCallback(() => {
    if (!current) return;
    navigate(`/listings/${current.slug || current._id}`);
  }, [current, navigate]);

  // ── Render states ──────────────────────────────────────────────────────────
  if (status === "locating" || status === "loading") {
    return (
      <div className="ds-shell ds-shell--state">
        <Loader2 className="ds-spin" size={26} strokeWidth={1.8} />
        <p className="ds-state-title">
          {status === "locating" ? "Finding where you are" : "Gathering places near you"}
        </p>
        <p className="ds-state-sub">Just a moment.</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="ds-shell ds-shell--state">
        <Compass size={26} strokeWidth={1.5} className="ds-state-icon" />
        <p className="ds-state-title">Where shall we look?</p>
        <p className="ds-state-sub">
          We couldn&rsquo;t read your location. Pick a coast and we&rsquo;ll start there.
        </p>
        <div className="ds-region-picker">
          {Object.entries(REGION_CENTRES).map(([key, r]) => (
            <button
              key={key}
              className="ds-region-btn"
              onClick={() => loadNearby(r.lat, r.lng, r.label, categoryFor(mood))}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="ds-shell ds-shell--state">
        <p className="ds-state-title">That didn&rsquo;t load</p>
        <p className="ds-state-sub">Something went wrong reaching our places.</p>
        <button className="ds-region-btn" onClick={() => setStatus("denied")}>
          Choose a region
        </button>
      </div>
    );
  }

  const next = places[index + 1];
  const image = current ? current.heroImage || current.gallery?.[0] || null : null;
  // A card shows its real distance when we have one, and otherwise says which
  // wider net caught it. Never both — the two answer the same question.
  const caption = current
    ? formatDistance(current.distance) ?? SCOPE_NOTE[scope] ?? null
    : null;

  // Past this point the deck is live. The meta row — and the filter button in
  // it — renders in every branch below: an empty result is exactly when you
  // most need the filter, so it must not disappear along with the cards.
  return (
    <div className="ds-shell">
      <div className="ds-meta">
        <span className="ds-meta-right">
          <span className="ds-filter" data-ds-filter>
            <button
              className={`ds-filter-btn ${mood !== "all" ? "ds-filter-btn--on" : ""}`}
              onClick={() => setShowFilter((v) => !v)}
              aria-label="Filter by mood"
              aria-expanded={showFilter}
              disabled={refetching}
            >
              <SlidersHorizontal size={13} strokeWidth={2.2} />
              {mood !== "all" && <span>{labelFor(mood)}</span>}
            </button>

            {showFilter && (
              <span className="ds-filter-menu" role="menu">
                {MOODS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    role="menuitemradio"
                    aria-checked={mood === key}
                    className={`ds-filter-item ${mood === key ? "ds-filter-item--on" : ""}`}
                    onClick={() => applyMood(key)}
                  >
                    <Icon size={14} strokeWidth={2} className="ds-filter-item-icon" />
                    <span className="ds-filter-item-label">{label}</span>
                    {mood === key && <Check size={13} strokeWidth={2.6} />}
                  </button>
                ))}
              </span>
            )}
          </span>
        </span>
      </div>

      {refetching ? (
        <div className="ds-inline-state">
          <Loader2 className="ds-spin" size={24} strokeWidth={1.8} />
          <p className="ds-state-sub">Finding {labelFor(mood).toLowerCase()} near you.</p>
        </div>
      ) : places.length === 0 ? (
        <div className="ds-inline-state">
          <MapPin size={26} strokeWidth={1.5} className="ds-state-icon" />
          <p className="ds-state-title">
            {mood === "all" ? "Nothing curated yet" : `No ${labelFor(mood).toLowerCase()} yet`}
          </p>
          {/* An empty deck now means the whole catalogue came back empty — the
              backend widens past the radius and past the region before giving
              up — so switching coast can't help, and only clearing the mood
              can. Offering a region picker here would be a dead end. */}
          <p className="ds-state-sub">
            {mood === "all"
              ? "We haven't verified any places yet. Check back soon."
              : `We haven't verified any ${labelFor(mood).toLowerCase()} in Goa yet.`}
          </p>
          {mood !== "all" && (
            <div className="ds-region-picker">
              <button className="ds-region-btn ds-region-btn--solid" onClick={() => applyMood("all")}>
                Show all places
              </button>
            </div>
          )}
        </div>
      ) : !hasMore ? (
        <div className="ds-inline-state">
          <Heart size={26} strokeWidth={1.5} className="ds-state-icon" />
          <p className="ds-state-title">
            {mood === "all"
              ? `That's everything ${scope === "nearby" ? "nearby" : "we've curated"}`
              : `That's every ${labelFor(mood).toLowerCase().replace(/s$/, "")} ${scope === "nearby" ? "nearby" : "we've curated"}`}
          </p>
          <p className="ds-state-sub">
            {savedCount > 0
              ? `You saved ${savedCount} ${savedCount === 1 ? "place" : "places"}.`
              : "You didn't save any this time."}
          </p>
          <div className="ds-region-picker">
            {savedCount > 0 && (
              <button className="ds-region-btn ds-region-btn--solid" onClick={() => navigate("/saved")}>
                View saved places
              </button>
            )}
            <button className="ds-region-btn" onClick={restart}>
              <RotateCcw size={14} strokeWidth={2} /> Start over
            </button>
          </div>
        </div>
      ) : (
        <>
      <div className="ds-deck">
        {/* Peek of the next card, so the deck reads as a stack */}
        {next && (
          <article className="ds-card ds-card--behind" aria-hidden="true">
            {(next.heroImage || next.gallery?.[0]) && (
              <img src={next.heroImage || next.gallery?.[0]} alt="" className="ds-card-img" />
            )}
            <div className="ds-card-scrim" />
          </article>
        )}

        <article
          ref={cardRef}
          className={`ds-card ds-card--top ${flyOut ? `ds-card--out-${flyOut}` : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {image
            ? <img src={image} alt={current.name} className="ds-card-img" draggable="false" />
            : <div className="ds-card-img ds-card-img--empty" />}
          <div className="ds-card-scrim" />

          <span className="ds-card-cat">{current.category}</span>
          {current.verified && <span className="ds-card-verified">Verified</span>}

          <div className="ds-card-body">
            <h3 className="ds-card-name">{current.name}</h3>
            <div className="ds-card-line">
              <MapPin size={12} strokeWidth={2} />
              <span>{current.location}</span>
              {current.rating > 0 && (
                <span className="ds-card-rating">
                  <Star size={12} fill="currentColor" strokeWidth={0} /> {current.rating.toFixed(1)}
                </span>
              )}
            </div>
            {caption && <p className="ds-card-distance">{caption}</p>}
            <p className="ds-card-desc">
              {current.tagline || current.description || "A place worth your time."}
            </p>
          </div>

          {/* Detail panel — the "i" button reveals what the card can't show */}
          {showInfo && (
            <div className="ds-info" onPointerDown={(e) => e.stopPropagation()}>
              <button
                className="ds-info-close"
                onClick={() => setShowInfo(false)}
                aria-label="Back to photo"
              >
                <ArrowLeft size={16} strokeWidth={2} />
              </button>
              <h4 className="ds-info-title">{current.name}</h4>

              {current.description && (
                <p className="ds-info-text">{current.description}</p>
              )}
              {current.localTip && (
                <div className="ds-info-block">
                  <span className="ds-info-label">Local tip</span>
                  <p className="ds-info-text">{current.localTip}</p>
                </div>
              )}
              {current.bestTime && (
                <div className="ds-info-block">
                  <span className="ds-info-label">Best time</span>
                  <p className="ds-info-text">{current.bestTime}</p>
                </div>
              )}
              {current.mustTry?.length > 0 && (
                <div className="ds-info-block">
                  <span className="ds-info-label">Must try</span>
                  <p className="ds-info-text">{current.mustTry.join(" · ")}</p>
                </div>
              )}
              {current.priceRange && (
                <div className="ds-info-block">
                  <span className="ds-info-label">Price</span>
                  <p className="ds-info-text">{current.priceRange}</p>
                </div>
              )}
              {current.openingHours && (
                <div className="ds-info-block">
                  <span className="ds-info-label">Hours</span>
                  <p className="ds-info-text">{current.openingHours}</p>
                </div>
              )}
              {current.scamAlert && (
                <div className="ds-info-block ds-info-block--warn">
                  <span className="ds-info-label">Heads up</span>
                  <p className="ds-info-text">{current.scamAlert}</p>
                </div>
              )}

              <button className="ds-info-link" onClick={openCurrent}>
                See full page
              </button>
            </div>
          )}
        </article>
      </div>

      <div className="ds-actions">
        <button className="ds-btn ds-btn--skip" onClick={() => handleAction("left")} aria-label="Skip this place">
          <X size={20} strokeWidth={2.5} />
        </button>
        <button
          className="ds-btn ds-btn--info"
          onClick={() => setShowInfo((v) => !v)}
          aria-label={showInfo ? "Hide details" : "Show details"}
          aria-pressed={showInfo}
        >
          <Info size={17} strokeWidth={2.2} />
        </button>
        <button className="ds-btn ds-btn--save" onClick={() => handleAction("right")} aria-label="Save this place">
          <Heart size={20} fill="currentColor" strokeWidth={0} />
        </button>
      </div>

      <p className="ds-hint">Swipe to Discover Goa</p>
        </>
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => { setShowLogin(false); commitSwipe("right", current); }}
          message="Sign in to save places you love"
        />
      )}
    </div>
  );
};

export default DiscoverSwipe;
