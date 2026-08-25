import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, X, Info, MapPin, Loader2, Compass,
  RotateCcw, ArrowLeft, Sparkles, Palmtree, Coffee, UtensilsCrossed,
  BedDouble, Martini, Landmark, Church, ShoppingBag, SlidersHorizontal, Check,
  RefreshCw, LocateFixed,
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

// How far out the deck looks, and how many cards it asks for. Both get quoted
// back to the visitor ("within 15 km"), so they live here rather than being
// repeated as bare numbers at each call site.
const SEARCH_RADIUS_M = 15000;
const DECK_LIMIT = 20;

// How far the deck can be widened once the first radius runs dry. 15 km is
// walking-or-short-drive distance and the right default for "what's around
// me", but a thin catalogue empties it in a few swipes -- South Goa currently
// holds three places -- and the honest next question is "what if I travel a
// bit". 100 km covers Goa end to end, so there is no step beyond it.
const RADIUS_STEPS_M = [SEARCH_RADIUS_M, 40000, 100000];
const nextRadius = (current) => RADIUS_STEPS_M.find((r) => r > current) ?? null;

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
  { key: "temples",   label: "Temples",      category: "spiritual",  Icon: Church },
  { key: "market",    label: "Markets",      category: "market",     Icon: ShoppingBag },
  { key: "activity",  label: "Things to do", category: "activity",   Icon: Compass },
];

// Facebook, Messenger, Instagram and the like render pages inside their own
// webview, which commonly refuses geolocation whatever the site's permission
// says. There's no fixing that from within the page — or from site settings,
// which is why pointing someone there sends them somewhere that cannot help.
// Leaving the webview is the only route, so that's the only thing worth saying.
const IN_APP_BROWSER = /\b(FBAN|FBAV|FB_IAB|Instagram|Line|MicroMessenger|Snapchat|Twitter|Pinterest|GSA)\b|;\s*wv\)/i;
const isInAppBrowser =
  typeof navigator !== "undefined" && IN_APP_BROWSER.test(navigator.userAgent || "");

// Getting out of a webview, and turning a site permission back on, are done in
// completely different places on the two platforms — there is no "Open in
// Chrome" and no address-bar padlock on an iPhone. iPadOS reports itself as a
// Mac, so the touch-point count is what separates it from a desktop Safari.
const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const categoryFor = (key) => MOODS.find((m) => m.key === key)?.category ?? null;
const labelFor    = (key) => MOODS.find((m) => m.key === key)?.label ?? "places";

// Past this many pixels of horizontal travel, releasing commits the swipe
// instead of snapping the card back to centre.
const SWIPE_COMMIT_PX = 110;

// A press that travels less than this in any direction counts as a tap rather
// than a swipe. Fingers drift a few pixels on even a deliberate tap, so this
// can't be zero.
const TAP_SLOP_PX = 10;

// How far someone has to travel before the deck is worth re-querying. Inside a
// 15 km radius a couple of hundred metres barely changes which places are in
// range, and GPS jitters by that much while sitting still — so a low threshold
// would mean constant refetches that return the same twenty cards. Two
// kilometres is roughly where the answer genuinely starts to differ.
const REFETCH_MOVE_M = 2000;

// High-accuracy fixes land about once a second and jitter by a few metres
// while standing still. Ignoring the ones that don't really move anyone keeps
// the deck from re-rendering on noise; the card quotes distance to the nearest
// 100 m, so nothing below this would be visible anyway.
const LIVE_MOVE_M = 10;

// ── Distance ────────────────────────────────────────────────────────────────
// $geoNear measures from wherever the deck was fetched, which starts going
// stale the moment someone walks off. Given a live fix and the place's own
// coordinates we can recompute it here on every position update, so the card
// counts down as they approach instead of freezing at whatever it said when
// the query ran.
const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

const metresBetween = (a, b) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
};

// Waiting on a position fix is what actually makes the deck feel slow — the
// query behind it takes a few hundred ms, while acquiring a location can take
// seconds (or the whole timeout, if the permission prompt goes unanswered).
// Remembering the last one for the session means every visit after the first
// starts fetching immediately instead of locating first; the live watch below
// then corrects it as soon as a real fix lands.
const ORIGIN_KEY = "trugoa_discover_origin";
const ORIGIN_TTL_MS = 30 * 60 * 1000;

// Every place swiped past this visit. Widening the radius re-runs the same
// query from the same spot, so the wider result is a superset of the narrower
// one — without this the first cards back are the ones just dismissed, and
// asking for 40 km looks like it did nothing. sessionStorage rather than
// localStorage: "already seen" means this visit, and someone returning
// tomorrow should get the full deck again.
const SEEN_KEY = "trugoa_discover_seen";

const readSeen = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set(); // private mode, or someone hand-edited the value
  }
};

const storeSeen = (ids) => {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable — the set still works for this page view */
  }
};

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

const storeOrigin = (lat, lng, label, precise) => {
  try {
    sessionStorage.setItem(ORIGIN_KEY, JSON.stringify({ lat, lng, label, precise, at: Date.now() }));
  } catch {
    /* storage unavailable — we just locate again next time */
  }
};

// Returns the bare measurement. What it's measured *from* differs -- the
// person, or the centre of a region they picked -- and the caller says which,
// so the wording can't be baked in here.
const formatDistance = (metres) => {
  if (typeof metres !== "number") return null;
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1)} km`;
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

  // ── Live location ──────────────────────────────────────────────────────────
  // The latest fix from watchPosition, held in state because the card's
  // distance is derived from it and has to re-render as the person moves.
  const [livePos, setLivePos] = useState(null);
  // Whether fixes are still arriving. False means the deck is no longer
  // following anyone — worth saying in the header, not worth an error screen.
  const [tracking, setTracking] = useState(false);
  // Set when someone has travelled far enough that the deck no longer reflects
  // where they are, but they're part-way through it. See handleFix.
  const [moved, setMoved] = useState(false);
  // Where the deck on screen was fetched from, and whether that came from a
  // real fix or a region they picked by hand — "within 15 km of you" is only
  // true for the former.
  const [centre, setCentre] = useState(null);
  // How far the current deck reached. Mirrored into a ref so runFetch can read
  // the latest value without being rebuilt on every change -- it's a dependency
  // of the position watch, which must not resubscribe.
  const [radius, setRadius] = useState(SEARCH_RADIUS_M);
  const radiusRef = useRef(SEARCH_RADIUS_M);
  // A ref, not state: runFetch reads it and must stay stable, and nothing
  // renders from it directly.
  const seen = useRef(readSeen());
  // The query found places but every one had already been swiped. Different
  // from finding nothing at all, and it needs different words.
  const [allSeen, setAllSeen] = useState(false);
  // A retry is in flight, and whether the browser refused outright. A refusal
  // can't be fixed by asking again — once someone blocks the site the prompt
  // never reappears — so it needs saying rather than silently doing nothing.
  const [retrying, setRetrying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  // "unavailable" | "timeout" | null. A refusal and a phone that simply can't
  // get a fix are different problems with different fixes, and saying
  // "we couldn't read your location" to both sends half of them to check a
  // permission that was never the issue.
  const [geoIssue, setGeoIssue] = useState(null);
  const origin = useRef(null);
  // The remembered-origin fetch on mount and the one triggered by the first
  // real fix can be in flight at once, and they don't necessarily come back in
  // the order they went out. Stamping each query lets a late reply from a
  // superseded origin be dropped instead of overwriting fresher results.
  const fetchSeq = useRef(0);

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

  // The position watch is subscribed once and needs to see the current deck to
  // judge whether refreshing would interrupt anyone. Reading that through a ref
  // keeps the subscription stable — re-subscribing on every swipe would drop
  // and re-acquire the fix continuously.
  const deckRef = useRef({ index: 0, count: 0, mood: "all" });
  useEffect(() => {
    deckRef.current = { index, count: places.length, mood };
  }, [index, places.length, mood]);

  // ── Fetching ───────────────────────────────────────────────────────────────
  // One query behind every entry point. `mode` picks how the wait is shown:
  // "full" drops the whole panel to a spinner (there's nothing on screen to
  // protect yet), "inline" keeps the shell and its controls put.
  const runFetch = useCallback(async (lat, lng, label, precise, category, mode) => {
    const seq = ++fetchSeq.current;
    origin.current = { lat, lng, label, precise };
    setCentre({ label, precise });
    storeOrigin(lat, lng, label, precise);

    if (mode === "full") setStatus("loading");
    else setRefetching(true);

    try {
      const { scope: resultScope, places: results } = await getNearbyBusinesses({
        lat, lng, maxDistance: radiusRef.current, limit: DECK_LIMIT, category,
      });
      if (seq !== fetchSeq.current) return; // superseded while we waited
      // Drop anything already swiped, so a wider search only ever adds.
      const fresh = results.filter((place) => !seen.current.has(place._id));
      setAllSeen(fresh.length === 0 && results.length > 0);
      setPlaces(fresh);
      setScope(resultScope);
      setIndex(0);
      setShowInfo(false);
      setMoved(false);
      if (mode === "full") setStatus("ready");
    } catch {
      if (seq === fetchSeq.current) setStatus("error");
    } finally {
      if (mode !== "full" && seq === fetchSeq.current) setRefetching(false);
    }
  }, []);

  const loadNearby = useCallback(
    (lat, lng, label, precise, category = null) =>
      runFetch(lat, lng, label, precise, category, "full"),
    [runFetch]
  );

  // Switching mood re-queries the same coordinates with a new category.
  const applyMood = useCallback(async (key) => {
    setMood(key);
    setShowFilter(false);
    const at = origin.current;
    if (!at) return;
    await runFetch(at.lat, at.lng, at.label, at.precise, categoryFor(key), "inline");
  }, [runFetch]);

  // Asks for a position on demand. The watch below covers the normal case, but
  // once it has failed it stays failed: nothing retries, and a visitor who
  // denied by reflex or was somewhere with no signal has no way back to the
  // thing the deck is actually for. This gives them one.
  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setRetrying(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setRetrying(false);
        setBlocked(false);
        setGeoIssue(null);
        setLivePos({ lat, lng });
        setTracking(true);
        runFetch(lat, lng, "Near you", true, categoryFor(deckRef.current.mood), "full");
      },
      (err) => {
        setRetrying(false);
        // 1 PERMISSION_DENIED — the site or the browser refused; asking again
        //   changes nothing until a setting does.
        // 2 POSITION_UNAVAILABLE — permission was fine, the fix wasn't: the
        //   phone's location is off, or there's nothing to lock onto.
        // 3 TIMEOUT — nothing wrong, just slow. Worth another go.
        const code = err?.code;
        setBlocked(code === 1);
        setGeoIssue(code === 2 ? "unavailable" : code === 3 ? "timeout" : null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [runFetch]);

  // Re-runs the same query with the next radius out. Kept as a deliberate
  // action rather than widening on its own: a deck that quietly starts
  // returning places an hour away stops meaning "near me", and the header would
  // be the only thing saying so.
  const widen = useCallback(async () => {
    const at = origin.current;
    const next = nextRadius(radiusRef.current);
    if (!at || !next) return;
    radiusRef.current = next;
    setRadius(next);
    await runFetch(at.lat, at.lng, at.label, at.precise, categoryFor(mood), "inline");
  }, [mood, runFetch]);

  // "You've moved — refresh": rebuilds the deck from wherever they are now.
  const refreshHere = useCallback(async () => {
    if (!livePos) return;
    await runFetch(livePos.lat, livePos.lng, "Near you", true, categoryFor(mood), "inline");
  }, [livePos, mood, runFetch]);

  // A denial is remembered per-site and the prompt never reappears, so asking
  // again achieves nothing until the setting itself changes. Reading the
  // permission up front lets the screen say so immediately, instead of after a
  // tap that appears to do nothing — and the change event brings someone
  // straight back the moment they fix it, with no reload.
  useEffect(() => {
    if (!navigator.permissions?.query) return; // older Safari — nothing to read
    let live = null;
    let cancelled = false;

    // Safari exposes the Permissions API but rejects the geolocation
    // descriptor, and some builds throw synchronously rather than returning a
    // rejected promise — which would escape the .catch below and take the
    // effect (and the deck) down with it.
    let query;
    try {
      query = navigator.permissions.query({ name: "geolocation" });
    } catch {
      return; // nothing readable here; the button still works
    }

    query
      .then((permission) => {
        if (cancelled) return;
        live = permission;
        setBlocked(permission.state === "denied");
        permission.onchange = () => {
          setBlocked(permission.state === "denied");
          if (permission.state === "granted") requestLocation();
        };
      })
      .catch(() => {
        /* some browsers reject the geolocation descriptor — the tap still works */
      });

    return () => {
      cancelled = true;
      if (live) live.onchange = null;
    };
  }, [requestLocation]);

  // ── Live position tracking ─────────────────────────────────────────────────
  const handleFix = useCallback((pos) => {
    const { latitude: lat, longitude: lng } = pos.coords;
    // Returning the previous object unchanged makes React skip the render, so
    // a phone sitting on a table costs nothing however often it reports in.
    setLivePos((prev) =>
      prev && metresBetween(prev, { lat, lng }) < LIVE_MOVE_M ? prev : { lat, lng }
    );
    setTracking(true);

    const at = origin.current;

    // First fix of the session — there's nothing on screen to disturb.
    if (!at) {
      loadNearby(lat, lng, "Near you", true, categoryFor(deckRef.current.mood));
      return;
    }

    // Still essentially where the deck was built from. The card distance
    // already follows the new fix; the deck itself doesn't need rebuilding.
    if (metresBetween(at, { lat, lng }) < REFETCH_MOVE_M) return;

    const { index: seen, count } = deckRef.current;

    // Nobody is part-way through — either they haven't started or they've
    // reached the end — so swapping the deck for their new surroundings is
    // exactly what they'd want.
    if (seen === 0 || seen >= count) {
      runFetch(lat, lng, "Near you", true, categoryFor(deckRef.current.mood), "inline");
      return;
    }

    // Mid-deck. Replacing the cards now would pull one out from under a
    // half-finished swipe and lose their place, so offer the refresh rather
    // than taking it.
    setMoved(true);
  }, [loadNearby, runFetch]);

  const handleFixFailure = useCallback((err) => {
    setTracking(false);
    const code = err?.code;
    if (code === 1) setBlocked(true);
    else setGeoIssue(code === 2 ? "unavailable" : code === 3 ? "timeout" : null);
    // Denial, timeout and position-unavailable alike. It's only a dead end if
    // we never got a position at all — once a deck is on screen, losing the
    // signal just means it stops following them, which the header already says.
    if (!origin.current) setStatus("denied");
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return; // already parked on the picker

    // Been here already this session — fetch from the remembered spot straight
    // away, so there's a deck to look at while the first real fix lands.
    const remembered = readStoredOrigin();
    if (remembered) {
      loadNearby(
        remembered.lat, remembered.lng,
        remembered.label, remembered.precise ?? false,
        categoryFor(deckRef.current.mood)
      );
    }

    // watchPosition rather than getCurrentPosition: the deck is meant to
    // follow the person around Goa, so it keeps listening and reacts when they
    // actually go somewhere. High accuracy is worth the battery here — the
    // whole feature is "what's around me right now".
    const watchId = navigator.geolocation.watchPosition(handleFix, handleFixFailure, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      // Longer than the old one-shot 5s: there's a deck on screen (or the
      // region picker) either way, so a slow first fix costs nobody anything.
      timeout: 20000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [loadNearby, handleFix, handleFixFailure]);

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

    // Seen either way — skipping a place is as much a decision as saving it,
    // and re-offering something already turned down is the annoying half.
    if (place?._id) {
      seen.current.add(place._id);
      storeSeen(seen.current);
    }

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

  // Explicitly asking for another pass, so the seen set is cleared too —
  // otherwise "Start over" would widen into an empty deck later on.
  const restart = () => {
    seen.current = new Set();
    storeSeen(seen.current);
    setAllSeen(false);
    setIndex(0);
    setSavedCount(0);
  };

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
        <p className="ds-state-title">Where are you?</p>
        <p className="ds-state-sub">
          {blocked === false && geoIssue === "unavailable"
            ? "Your phone couldn’t get a fix. Check Location is switched on in its own settings — permission for this site is fine."
            : blocked === false && geoIssue === "timeout"
            ? "That took too long. Try again — a fix comes quicker outdoors or by a window."
            : !blocked
            ? "This deck is built around wherever you're standing — we just need your location to read it."
            : isInAppBrowser
            ? isIOS
              ? "This app’s built-in browser won’t share your location. Tap the share icon and choose “Open in Safari”."
              : "This app’s built-in browser won’t share your location. Tap ⋮ at the top and choose “Open in Chrome”."
            : isIOS
            ? "Location is switched off for this site. Check Settings › Privacy › Location Services is on and your browser is allowed. In Safari you can also tap “AA” in the address bar → Website Settings → Location."
            : "Location is switched off for this site. Turn it on for trugoa.in in your browser’s site settings, then try again."}
        </p>

        {/* The point of the feature, so it leads. Picking a coast is the
            consolation prize: it anchors the deck to a fixed centroid, which
            can't tell you what's near you and won't say a distance. */}
        <div className="ds-region-picker">
          <button
            className="ds-region-btn ds-region-btn--solid"
            onClick={requestLocation}
            disabled={retrying}
          >
            {retrying
              ? <><Loader2 className="ds-spin" size={14} strokeWidth={2} /> Finding you</>
              : <><LocateFixed size={14} strokeWidth={2} /> Use my location</>}
          </button>
        </div>

        <p className="ds-state-hint">or browse a coast &mdash; without distances</p>
        <div className="ds-region-picker ds-region-picker--tight">
          {Object.entries(REGION_CENTRES).map(([key, r]) => (
            <button
              key={key}
              className="ds-region-btn ds-region-btn--quiet"
              onClick={() => loadNearby(r.lat, r.lng, r.label, false, categoryFor(mood))}
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

  // Recomputed against the live fix when we have one, so it counts down as the
  // person walks. The server's own figure is the fallback for places saved
  // without coordinates, and for the moments before the first fix arrives.
  const liveDistance =
    current && livePos &&
    typeof current.latitude === "number" && typeof current.longitude === "number"
      ? metresBetween(livePos, { lat: current.latitude, lng: current.longitude })
      : null;

  const serverDistance = typeof current?.distance === "number" ? current.distance : null;
  const distanceNow = liveDistance ?? serverDistance;

  // Whether that number was measured from the person or from somewhere else.
  // A live fix is their own position by definition. The server's figure is
  // measured from wherever the deck was anchored, which is only them when that
  // came from a real fix — pick "North Goa" while standing in the south and
  // $geoNear measures from the middle of North Goa, so a place an hour's drive
  // away comes back as 2 km.
  const fromUser = liveDistance !== null || Boolean(centre?.precise);

  // A card shows its distance when we have one, and otherwise says which wider
  // net caught it. Never both — the two answer the same question.
  //
  // A measurement taken from a picked region is dropped rather than relabelled.
  // The origin is a fixed centroid — North Goa's sits near Assagao — so the
  // number is the distance from a point the reader never chose and cannot see.
  // Several places cluster within a few kilometres of it, which puts a row of
  // "3.5 km" captions in front of someone standing an hour's drive south, and
  // naming the origin doesn't stop that reading as "everything is close".
  // Where they are is the only origin that makes a distance worth printing.
  const measured = formatDistance(distanceNow);
  const caption = !current
    ? null
    : fromUser && measured
    ? `${measured} away`
    : centre && !centre.precise
    ? `In ${centre.label}`
    : SCOPE_NOTE[scope] ?? null;

  // ── "You are here" ─────────────────────────────────────────────────────────
  // What the deck is actually showing, phrased so it never overstates: only
  // the proximity tier gets to claim a radius, and only a real fix gets to say
  // "you" rather than naming the region that was picked by hand.
  const hereTitle =
    scope === "nearby"
      ? `Within ${radius / 1000} km of ${centre?.precise ? "you" : centre?.label ?? "here"}`
      : SCOPE_NOTE[scope] ?? "Across Goa";

  const atLimit = places.length >= DECK_LIMIT;
  const hereSub =
    places.length === 0
      ? "Nothing curated here yet"
      : `${places.length}${atLimit ? "+" : ""} ${places.length === 1 ? "place" : "places"}` +
        (scope === "nearby" ? " · nearest first" : "");

  // Past this point the deck is live. The header and the meta row — and the
  // filter button in it — render in every branch below: an empty result is
  // exactly when you most need the filter, so it must not disappear along with
  // the cards.
  return (
    <div className="ds-shell">
      {/* Where the deck is anchored, whether it's still following them, and the
          mood filter — one row rather than a status panel with a control
          stranded on its own line beneath it.
          Desktop drops the whole thing: the deck sits in the homepage's
          two-column hero there, where Explore's category filters are a click
          away. It stays when it's carrying a button, though — hiding it
          outright would take "Use my location" with it and leave a desktop
          visitor who picked a coast with no way back short of a reload. */}
      <div className={`ds-here${moved || (centre && !centre.precise) ? "" : " ds-here--info"}`}>
        <span
          className={`ds-here-dot${tracking ? " ds-here-dot--live" : ""}`}
          aria-hidden="true"
        />
        <span className="ds-here-copy">
          <span className="ds-here-title">{hereTitle}</span>
          <span className="ds-here-sub">
            {moved ? "You’ve moved since these loaded" : hereSub}
          </span>
        </span>
        {moved ? (
          <button className="ds-here-refresh" onClick={refreshHere} disabled={refetching}>
            <RefreshCw size={12} strokeWidth={2.4} />
            Refresh
          </button>
        ) : centre && !centre.precise ? (
          // Anchored to a picked coast. Without this the only way back to a
          // real position is a page reload, so anyone who tapped a region once
          // stays on centroid results for the rest of the session.
          <button className="ds-here-refresh" onClick={requestLocation} disabled={retrying}>
            <LocateFixed size={12} strokeWidth={2.4} />
            {retrying ? "Finding" : "Use my location"}
          </button>
        ) : null}

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
      </div>

      {refetching ? (
        <div className="ds-inline-state">
          <Loader2 className="ds-spin" size={24} strokeWidth={1.8} />
          <p className="ds-state-sub">Finding {labelFor(mood).toLowerCase()} near you.</p>
        </div>
      ) : allSeen ? (
        /* The search found places — they'd all been swiped already. Saying
           "nothing curated" here would be wrong twice over: there is
           something, and they've seen it. */
        <div className="ds-inline-state">
          <Check size={26} strokeWidth={1.5} className="ds-state-icon" />
          <p className="ds-state-title">
            {scope === "nearby"
              ? `You've seen everything within ${radius / 1000} km`
              : "You've seen everything we've curated"}
          </p>
          <p className="ds-state-sub">
            {nextRadius(radius)
              ? "Try looking a little further out."
              : "Start over to go through them again."}
          </p>
          <div className="ds-region-picker">
            {nextRadius(radius) && (
              <button
                className="ds-region-btn ds-region-btn--solid"
                onClick={widen}
                disabled={refetching}
              >
                <Compass size={14} strokeWidth={2} />
                Look within {nextRadius(radius) / 1000} km
              </button>
            )}
            <button className="ds-region-btn" onClick={restart}>
              <RotateCcw size={14} strokeWidth={2} /> Start over
            </button>
          </div>
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
            {(() => {
              const reach = scope === "nearby" ? `within ${radius / 1000} km` : "we've curated";
              return mood === "all"
                ? `That's everything ${reach}`
                : `That's every ${labelFor(mood).toLowerCase().replace(/s$/, "")} ${reach}`;
            })()}
          </p>
          <p className="ds-state-sub">
            {savedCount > 0
              ? `You saved ${savedCount} ${savedCount === 1 ? "place" : "places"}.`
              : "You didn't save any this time."}
          </p>
          <div className="ds-region-picker">
            {/* Running out is exactly when "what if I go a bit further" is the
                live question, so widening leads here — ahead of saved places
                and starting over, which both end the session rather than
                continue it. Only offered while there's a wider step left and
                the deck is actually distance-bound; the region and Goa tiers
                already searched everything a radius could reach. */}
            {nextRadius(radius) && (
              <button
                className="ds-region-btn ds-region-btn--solid"
                onClick={widen}
                disabled={refetching}
              >
                <Compass size={14} strokeWidth={2} />
                Look within {nextRadius(radius) / 1000} km
              </button>
            )}
            {savedCount > 0 && (
              <button className="ds-region-btn" onClick={() => navigate("/saved")}>
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
          {/* Directly under the category, where it reads as a property of the
              place rather than as the last line of a paragraph about it. */}
          {caption && <span className="ds-card-near">{caption}</span>}
          {current.verified && <span className="ds-card-verified">Verified</span>}

          {/* Name and location only. Everything else the card used to carry —
              rating, tagline — is a swipe away behind the "i" button, and the
              photo does more work without text competing with it. */}
          <div className="ds-card-body">
            <h3 className="ds-card-name">{current.name}</h3>
            <div className="ds-card-line">
              <MapPin size={12} strokeWidth={2} />
              <span>{current.location}</span>
            </div>
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
