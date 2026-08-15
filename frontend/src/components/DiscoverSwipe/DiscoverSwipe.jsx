import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, X, Info, MapPin, Star, Loader2, Compass,
  RotateCcw, ArrowLeft,
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

// Past this many pixels of horizontal travel, releasing commits the swipe
// instead of snapping the card back to centre.
const SWIPE_COMMIT_PX = 110;

const formatDistance = (metres) => {
  if (typeof metres !== "number") return null;
  return metres < 1000
    ? `${Math.round(metres)} m away`
    : `${(metres / 1000).toFixed(1)} km away`;
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
  const [regionLabel, setRegionLabel] = useState(null);

  // Drag state lives in a ref so pointermove doesn't re-render on every frame;
  // the visible transform is written straight to the node instead.
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 });
  const cardRef = useRef(null);
  const [flyOut, setFlyOut] = useState(null); // "left" | "right" | null

  const current = places[index];
  const hasMore = index < places.length;

  // ── Fetching ───────────────────────────────────────────────────────────────
  const loadNearby = useCallback(async (lat, lng, label) => {
    setStatus("loading");
    setRegionLabel(label || null);
    try {
      const data = await getNearbyBusinesses({ lat, lng, maxDistance: 15000, limit: 20 });
      setPlaces(data);
      setIndex(0);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  // ── Geolocation on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!("geolocation" in navigator)) return; // already parked on the picker

    let cancelled = false;
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
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
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
              onClick={() => loadNearby(r.lat, r.lng, r.label)}
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

  if (places.length === 0) {
    return (
      <div className="ds-shell ds-shell--state">
        <MapPin size={26} strokeWidth={1.5} className="ds-state-icon" />
        <p className="ds-state-title">Nothing curated here yet</p>
        <p className="ds-state-sub">
          We haven&rsquo;t verified any places within 15&nbsp;km. Try another coast.
        </p>
        <div className="ds-region-picker">
          {Object.entries(REGION_CENTRES).map(([key, r]) => (
            <button key={key} className="ds-region-btn" onClick={() => loadNearby(r.lat, r.lng, r.label)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div className="ds-shell ds-shell--state">
        <Heart size={26} strokeWidth={1.5} className="ds-state-icon" />
        <p className="ds-state-title">That&rsquo;s everything nearby</p>
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
    );
  }

  const next = places[index + 1];
  const image = current.heroImage || current.gallery?.[0] || null;
  const distance = formatDistance(current.distance);

  return (
    <div className="ds-shell">
      <div className="ds-meta">
        <span className="ds-meta-region">{regionLabel || "Near you"}</span>
        <span className="ds-meta-count">{index + 1} / {places.length}</span>
      </div>

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
            {distance && <p className="ds-card-distance">{distance}</p>}
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

              {current.slug && (
                <button
                  className="ds-info-link"
                  onClick={() => navigate(`/listings/${current.slug}`)}
                >
                  See full page
                </button>
              )}
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

      <p className="ds-hint">Drag a card, or use the buttons</p>

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
