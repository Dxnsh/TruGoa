import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Waves, Landmark, UtensilsCrossed, Mountain, Music2, Flower2,
  ArrowRight, ArrowLeft, ChevronRight, MousePointer2, Menu,
  PenLine, BookOpen, Backpack, Camera, Bell, Search, SlidersHorizontal,
  Heart, Wind, MoreHorizontal, User, ArrowUp, LogOut,
  ChevronLeft, MapPin, TrendingUp, Star, Gem, Moon, Flame,
} from "lucide-react";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import { CATEGORIES } from "../../constants/categories";
import DiscoverSwipe from "../../components/DiscoverSwipe/DiscoverSwipe";
import Logo from "../../components/Logo/Logo";
import { getBusinesses, getStories } from "../../services/api";
import { mapBusiness } from "../../services/mapper";
import { useTourist } from "../../context/TouristContext";
import LoginModal from "../../components/LoginModal/LoginModal";
import MobileMenu from "../../components/MobileMenu/MobileMenu";
import OpenBadge from "../../components/OpenBadge/OpenBadge";
import { getTrendingPlaces } from "../../services/api";
import useIsMobile from "../../hooks/useIsMobile";
import "./homepage.css"


// Category shortcuts come from constants/categories.js — the same list the
// Explore page renders. Each one deep-links to /explore?category=<key>, which
// opens that section there directly.

/* ─── SCROLL REVEAL ──────────────────────────────────────────────────────────── */
const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
};

const BADGE_ICON_MAP = {
  TRENDING: TrendingUp,
  POPULAR: Star,
  "HIDDEN GEM": Gem,
  TONIGHT: Moon,
  "WHAT'S HOT": UtensilsCrossed,
};

// inside component


const JOURNEY_WAY_STEPS = [
  { Icon: PenLine,  title: "Tell Us",         desc: "Your interests & travel style" },
  { Icon: BookOpen, title: "We Plan",         desc: "Custom itinerary just for you" },
  { Icon: Backpack, title: "You Explore",     desc: "Experience Goa like a local" },
  { Icon: Camera,   title: "Create Memories", desc: "That last a lifetime" },
];

// Sample exchange shown in the GoaGuide panel. It's a static illustration of
// what the assistant sounds like — the real conversation happens on /goaguide.
const GUIDE_TOPICS = ["Hidden beaches", "Local food", "2-day itinerary"];

const GUIDE_PROMPTS = ["Rainy-day plan", "Local seafood shack", "North vs South?"];

const STATS = [
  { value: "20+", label: "Verified Places",     sub: "Handpicked by locals" },
  { value: "95%",  label: "Recommended",         sub: "By real travellers" },
  { value: "100%", label: "No Sponsored Listings", sub: "Just honest recommendations" },
];

const TESTIMONIAL = {
  quote: "TruGoa showed us the Goa we never knew existed.",
  names: ["Priya", "Arjun"],
  city: "Mumbai",
};

/* ══════════════════════════════════════════════════════════════════════════════
   HOMEPAGE
══════════════════════════════════════════════════════════════════════════════ */
const Homepage = () => {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const { isTouristLoggedIn, tourist, touristLogout } = useTourist();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const [trendingItems, setTrendingItems] = useState([]);
  const trendingTrackRef = useRef(null);

useEffect(() => {
  let cancelled = false;
  getTrendingPlaces()
    .then((data) => { if (!cancelled) setTrendingItems(data); })
    .catch(() => { if (!cancelled) setTrendingItems([]); });
  return () => { cancelled = true; };
}, []);

const scrollTrending = (dir) => {
  const track = trendingTrackRef.current;
  if (!track) return;
  const card = track.querySelector(".tr-card");
  const step = card ? card.offsetWidth + 20 : track.clientWidth * 0.85;
  track.scrollBy({ left: dir * step, behavior: "smooth" });
};

useEffect(() => {
  const track = trendingTrackRef.current;
  if (!track) return;
  const onScroll = () => {
    const card = track.querySelector(".tr-card");
    if (!card) return;
    const step = card.offsetWidth + 20;
    setActiveDot(Math.round(track.scrollLeft / step));
  };
  track.addEventListener("scroll", onScroll, { passive: true });
  return () => track.removeEventListener("scroll", onScroll);
}, []);
  // Dismiss the profile menu on any tap outside it.
  useEffect(() => {
    if (!showProfile) return;
    const handler = (e) => {
      if (!e.target.closest("[data-hd-profile]")) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [showProfile]);
  // The global Navbar is hidden on the mobile homepage, so this page owns the
  // menu its own header opens.
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [placesRef,  placesVisible ] = useScrollReveal();
  const [journeyRef, journeyVisible] = useScrollReveal();
  const [guideRef,   guideVisible  ] = useScrollReveal();
  const [storiesRef, storiesVisible] = useScrollReveal();
  const [statsRef,   statsVisible  ] = useScrollReveal();
  const [trendingRef, trendingVisible] = useScrollReveal();
  // Journey steps are a card deck rather than a static row — one step is in
  // focus at a time, and the rest stack behind it.
  const [stepIndex, setStepIndex] = useState(0);
  const swipeStartX = useRef(null);

  const stepCount = JOURNEY_WAY_STEPS.length;
  const goToStep = (delta) =>
    setStepIndex((i) => (i + delta + stepCount) % stepCount);

  // Horizontal drag past 40px flips the deck; anything shorter counts as a tap.
  const onDeckPointerDown = (e) => { swipeStartX.current = e.clientX; };
  const onDeckPointerUp = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) > 40) goToStep(dx < 0 ? 1 : -1);
  };

  // Featured Places pulls the same "featured" businesses shown on the
  // Explore page, so marking/unmarking a place there (or from the admin
  // dashboard) is the single place that controls what shows up here.
  const [featuredPlaces, setFeaturedPlaces] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Order open places first but don't hide the closed ones — a late-night
        // visitor should still see a full row, just led by what's open now and
        // filled out with "Opens 8 AM". Ask for a few extra so the slice to four
        // always lands on the open ones when there are enough.
        const { items } = await getBusinesses({
          featured: true, openNow: false, openFirst: true, limit: 8,
        });
        const mapped = items.slice(0, 4).map((biz, i) => mapBusiness(biz, i));
        if (!cancelled) setFeaturedPlaces(mapped);
      } catch {
        if (!cancelled) setFeaturedPlaces([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [stories, setStories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getStories()
      .then((data) => { if (!cancelled) setStories(data.slice(0, 4)); })
      .catch(() => { if (!cancelled) setStories([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="hp-root">
      <SEO path="/" />

      {/* ══ HERO ════════════════════════════════════════ */}
      <section className="hero-discover">
        {/* Compact app-style header — mobile only. On desktop the global
            Navbar covers this, so rendering both would duplicate the logo. */}
        {isMobile && (
          <div className="hd-header">
            {/* Menu and logo travel together on the left; the actions hold the
                right edge. Centring the logo left it drifting as the actions
                changed width between signed-in and signed-out. */}
            <div className="hd-header-left">
              <button
                className="hd-icon-btn"
                onClick={() => setShowMobileMenu(true)}
                aria-label="Open menu"
                aria-expanded={showMobileMenu}
              >
                <Menu size={20} strokeWidth={2} />
              </button>

              <Logo size={28} />
            </div>

            <div className="hd-header-actions">
              <button className="hd-icon-btn hd-bell" onClick={() => navigate("/saved")} aria-label="Saved places">
                <Bell size={19} strokeWidth={2} />
                <span className="hd-bell-dot" />
              </button>
              {isTouristLoggedIn ? (
                <div className="hd-profile" data-hd-profile>
                  <button
                    className="hd-avatar"
                    onClick={() => setShowProfile((v) => !v)}
                    aria-label="Your account"
                    aria-expanded={showProfile}
                  >
                    {tourist.avatar ? (
                      <img src={tourist.avatar} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      tourist.name?.[0]?.toUpperCase()
                    )}
                  </button>

                  {showProfile && (
                    <div className="hd-profile-menu">
                      <div className="hd-profile-head">
                        <span className="hd-profile-avatar">
                          {tourist.avatar ? (
                            <img src={tourist.avatar} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            tourist.name?.[0]?.toUpperCase()
                          )}
                        </span>
                        <span className="hd-profile-id">
                          <span className="hd-profile-name">{tourist.name}</span>
                          <span className="hd-profile-email" title={tourist.email}>
                            {tourist.email}
                          </span>
                        </span>
                      </div>

                      <button
                        className="hd-profile-signout"
                        onClick={() => { touristLogout(); setShowProfile(false); }}
                      >
                        <LogOut size={16} strokeWidth={2} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="hd-avatar hd-avatar-guest" onClick={() => setShowLoginModal(true)} aria-label="Sign in">
                  <User size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="hd-layout">
          {/* Editorial copy — desktop only, sits opposite the deck */}
          <div className="hd-copy">
            <div className="hd-copy-badge">
              <span className="hd-copy-dot" />
              Truthfully curated. Locally rooted.
            </div>

            <h1 className="hd-copy-h1">
              This isn&rsquo;t the <br />
              <span className="hd-copy-accent">Goa</span> you googled.
            </h1>

            <p className="hd-copy-sub">
              Swipe through places we&rsquo;ve stood in ourselves &mdash; verified,
              unsponsored, and picked by people who live here.
            </p>

            <div className="hd-copy-stats">
              {[
                { value: "20+", label: "Verified places" },
                { value: "15 km", label: "Around you" },
                { value: "0", label: "Paid listings" },
              ].map((s) => (
                <div key={s.label} className="hd-copy-stat">
                  <div className="hd-copy-stat-value">{s.value}</div>
                  <div className="hd-copy-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live swipe deck — geolocation + real places from the database */}
          <div className="hd-deck-col">
            {/* <button className="hd-search" onClick={() => navigate("/explore")}>
              <Search size={17} strokeWidth={2} className="hd-search-icon" />
              <span className="hd-search-placeholder">Where do you want to discover?</span>
              <span
                className="hd-search-filter"
                role="button"
                aria-label="Filters"
                onClick={(e) => { e.stopPropagation(); navigate("/explore"); }}
              >
                <SlidersHorizontal size={16} strokeWidth={2.2} />
              </span>
            </button> */}

            <DiscoverSwipe />

            {/* Category shortcuts are mobile-only. On desktop the Explore page
                carries its own filter chips, and repeating them here crowded
                the hero — the swipe deck is the point of this section. */}
            {isMobile && (
              <div className="hd-categories">
                {CATEGORIES.map(({ key, label, sub, icon: Icon }) => (
                  <button
                    key={key}
                    className="hd-cat"
                    title={sub}
                    onClick={() =>
                      navigate(key === "all" ? "/explore" : `/explore?category=${key}`)
                    }
                  >
                    <Icon size={16} strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <MobileMenu
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        onRequestLogin={() => setShowLoginModal(true)}
      />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          message="Sign in to explore Goa's best places"
        />
      )}


      {/* ══ FEATURED PLACES IN GOA ═══════════════════════ */}
      <section ref={placesRef} className="split-section"
        style={{ padding: isMobile ? "56px 24px" : "88px clamp(48px,7vw,120px)" }}>
        <div className={`split-grid reveal ${placesVisible ? "visible" : ""}`}
          style={{ gridTemplateColumns: isMobile ? "1fr" : "280px 1fr" }}>
          <div className="split-left">
            <p className="eyebrow-dark">Curated For You</p>
            <h2 className="split-heading">Featured Places in Goa</h2>
            <p className="split-body">
              Places we love. Experiences that stay with you forever.
            </p>
            <button className="btn-outline-dark" onClick={() => navigate("/explore")}>
              Explore All Places <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="places-grid">
            {featuredPlaces.map((p) => (
              <div
                key={p.id}
                className="place-card"
                onClick={() => navigate(`/listings/${p.slug || p.id}`)}
              >
                <img src={p.image} alt={p.name} className="place-card-img" />
                <div className="place-card-overlay" />
                <div className="place-card-text">
                  <div className="place-card-name">{p.name}</div>
                  <div className="place-card-loc">{p.area || p.location}</div>
                  <div style={{ marginTop: 6 }}>
                    <OpenBadge place={p} variant="onImage" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    {/* ══ WHAT'S TRENDING IN GOA ════════════════════════ */}

      <section ref={trendingRef} className="light-band tr-section">
        <div className={`tr-wrap reveal ${trendingVisible ? "visible" : ""}`}>
          <div className="tr-head">
            <div className="tr-head-copy">
              <p className="tr-eyebrow">
                <Flame size={13} strokeWidth={2.2} />
                Trending in Goa
              </p>
              <h2 className="tr-heading">
                What&rsquo;s <span className="tr-heading-accent">trending</span> in Goa
              </h2>
              <p className="tr-sub">Real-time picks loved by travellers this week.</p>
            </div>

            <div className="tr-nav">
              <button className="tr-nav-btn" onClick={() => scrollTrending(-1)} aria-label="Previous">
                <ArrowLeft size={16} strokeWidth={2} />
              </button>
              <button className="tr-nav-btn" onClick={() => scrollTrending(1)} aria-label="Next">
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

         <div className="tr-track" ref={trendingTrackRef}>
          {trendingItems.map((item) => {
            const Icon = BADGE_ICON_MAP[item.badge] || TrendingUp;
            return (
              <article
                key={item._id}
                className="tr-card"
                onClick={() => navigate(`/trending/${item.slug}`)}
              >
                <div className="tr-card-media">
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <span className="tr-card-badge">
                    <Icon size={12} strokeWidth={2.2} />
                    {item.badge}
                  </span>
                </div>
                <div className="tr-card-body">
                  <span className="tr-card-loc">
                    <MapPin size={12} strokeWidth={2} />
                    {item.location}
                  </span>
                  {/* Only appears when the trending card links to a real
                      listing whose hours we know — keeps someone from tapping
                      through to a closed door at 11 PM with no warning. */}
                  {item.openStatus && (
                    <div style={{ marginTop: 6 }}>
                      <OpenBadge place={item} />
                    </div>
                  )}
                  <h3 className="tr-card-title">{item.title}</h3>
                  <p className="tr-card-desc">{item.description}</p>
                  <div className="tr-card-foot">
                    <span className="tr-card-avatars">
                      {(item.avatars || []).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          className="tr-avatar"
                          style={{ zIndex: item.avatars.length - i }}
                        />
                      ))}
                    </span>
                    <span className="tr-card-loved">
                      Loved by <strong>{(item.lovedCount || 0).toLocaleString()}</strong> travellers
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
          </div>

      <div className="tr-dots">
        {Array.from({ length: trendingItems.length }).map((_, i) => (
          <span key={i} className={`tr-dot ${i === activeDot ? "active" : ""}`} />
        ))}
      </div>

          <div className="tr-dots">
            {Array.from({ length: trendingTrackRef.length }).map((_, i) => (
              <span key={i} className={`tr-dot ${i === activeDot ? "active" : ""}`} />
            ))}
          </div>

          <button className="tr-cta" onClick={() => navigate("/trending")}>
            Explore all trending places <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* ══ STORIES THAT INSPIRE TRAVEL ═══════════════════ */}
      <section ref={storiesRef} className="split-section"
        style={{ padding: isMobile ? "56px 24px" : "88px clamp(48px,7vw,120px)" }}>
        <div className={`split-grid reveal ${storiesVisible ? "visible" : ""}`}
          style={{ gridTemplateColumns: isMobile ? "1fr" : "280px 1fr" }}>
          <div className="split-left">
            <p className="eyebrow-dark">Editor's Pick</p>
            <h2 className="split-heading">Stories that inspire travel.</h2>
            <p className="split-body">
              reads, local insights and hidden tales from Goa.
            </p>
            <button className="btn-outline-dark" onClick={() => navigate("/stories/" + (stories[0]?.slug || "destinations"))}>
              Explore Stories <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="stories-grid" style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}>
            {stories.map((item) => (
              <article key={item.slug} className="story-card"
                onClick={() => navigate(`/stories/${item.slug}`)}>
                <img src={item.image} alt={item.title} className="story-card-img" />
                <p className="story-card-cat">{item.category}</p>
                <h4 className="story-card-title">{item.title}</h4>
                {item.readTime && <p className="story-card-read">{item.readTime}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS + TESTIMONIAL ═══════════════════════════ */}
      {/* <section ref={statsRef} className="stats-section">
        <div className={`stats-wrap reveal ${statsVisible ? "visible" : ""}`}
          style={{ flexDirection: isMobile ? "column" : "row" }}>
          <div className="stats-numbers">
            {STATS.map((s) => (
              <div key={s.label} className="stats-item">
                <div className="stats-value">{s.value}</div>
                <div className="stats-label">{s.label}</div>
                <div className="stats-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="stats-testimonial">
            <p className="stats-quote">&ldquo;{TESTIMONIAL.quote}&rdquo;</p>
            <div className="stats-quote-author">
              <div className="stats-avatars">
                {TESTIMONIAL.names.map((n) => (
                  <span key={n} className="stats-avatar">{n[0]}</span>
                ))}
              </div>
              <span>— {TESTIMONIAL.names.join(" & ")}, {TESTIMONIAL.city}</span>
            </div>
          </div>
        </div>
      </section> */}

      <Footer />

      {!isMobile && (
        <button className="fab-ai" onClick={() => navigate("/goaguide")}>
          Ask GoaGuide AI
        </button>
      )}
    </div>
  );
};

export default Homepage;
