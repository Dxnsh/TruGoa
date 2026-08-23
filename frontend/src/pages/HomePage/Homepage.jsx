import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Waves, Landmark, UtensilsCrossed, Mountain, Music2, Flower2,
  ArrowRight, ChevronRight, MousePointer2, Menu,
  PenLine, BookOpen, Backpack, Camera, Bell, Search, SlidersHorizontal,
  Heart, Wind, MoreHorizontal, User, ArrowUp, LogOut,
  ChevronLeft, MapPin,
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

import useIsMobile from "../../hooks/useIsMobile";
import "./homepage.css";

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
        const data = await getBusinesses({ featured: true });
        const mapped = data.map((biz, i) => mapBusiness(biz, i));
        if (!cancelled) setFeaturedPlaces(mapped.slice(0, 4));
      } catch {
        if (!cancelled) setFeaturedPlaces([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Editor's Pick pulls real story collections — each card must link to
  // its own collection, not a hardcoded one.
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ YOUR GOA JOURNEY, YOUR WAY ════════════════════ */}
      <section ref={journeyRef} className="dark-band jw-section">
        <span className="jw-arcs" aria-hidden="true" />

        <div className={`jw-wrap reveal ${journeyVisible ? "visible" : ""}`}>
          <div className="jw-copy">
            <p className="db-eyebrow">Plan Your Trip &middot; {stepCount} Steps</p>
            <h2 className="db-heading">
              Your Goa Journey,<br />
              <span className="db-heading-accent">Your Way.</span>
            </h2>
            <p className="db-sub">
              Tell us what you love, swipe through how it comes together, and
              we&rsquo;ll craft an itinerary that actually feels like yours &mdash;
              not a template.
            </p>
            <button className="jw-cta" onClick={() => navigate("/itinerary")}>
              Create My Itinerary <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="jw-deck-col">
            <div
              className="jw-deck"
              onPointerDown={onDeckPointerDown}
              onPointerUp={onDeckPointerUp}
              onPointerCancel={() => { swipeStartX.current = null; }}
            >
              {JOURNEY_WAY_STEPS.map(({ Icon, title, desc }, i) => {
                // How far back in the stack this card currently sits.
                const offset = (i - stepIndex + stepCount) % stepCount;
                return (
                  <article
                    key={title}
                    className="jw-card"
                    data-offset={offset}
                    aria-hidden={offset !== 0}
                    onClick={() => { if (offset === 0) goToStep(1); }}
                  >
                    <span className="jw-card-count">
                      {String(i + 1).padStart(2, "0")} / {String(stepCount).padStart(2, "0")}
                    </span>
                    <span className="jw-card-icon"><Icon size={22} strokeWidth={1.6} /></span>
                    <h3 className="jw-card-title">{title}</h3>
                    <p className="jw-card-desc">{desc}</p>
                  </article>
                );
              })}
            </div>

            <div className="jw-deck-nav">
              <span className="jw-deck-hint">
                <ChevronLeft size={14} strokeWidth={2} />
                swipe or tap to explore each step
                <ChevronRight size={14} strokeWidth={2} />
              </span>
              <button className="jw-deck-btn" onClick={() => goToStep(-1)} aria-label="Previous step">
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <button className="jw-deck-btn" onClick={() => goToStep(1)} aria-label="Next step">
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ GOAGUIDE AI ═══════════════════════════════════ */}
      <section ref={guideRef} className="dark-band ga-section">
        <div className={`ga-wrap reveal ${guideVisible ? "visible" : ""}`}>
          <div className="ga-copy">
            <span className="ga-badge">
              <span className="ga-badge-dot" />
              GoaGuide is online
            </span>

            <h2 className="db-heading ga-heading">
              Not just answers.<br />
              <span className="db-heading-accent">A local friend.</span>
            </h2>

            <p className="db-sub">
              Ask it anything &mdash; hidden beaches, rainy-day plans, where locals
              actually eat. It knows Goa the way a friend who grew up here would.
            </p>

            <div className="ga-topics">
              {GUIDE_TOPICS.map((topic) => (
                <button key={topic} className="ga-topic" onClick={() => navigate("/goaguide")}>
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="ga-panel">
            <div className="ga-panel-head">
              <span className="ga-panel-avatar">G</span>
              <span className="ga-panel-id">
                <span className="ga-panel-name">GoaGuide AI</span>
                <span className="ga-panel-status">
                  <span className="ga-panel-dot" />
                  Online now
                </span>
              </span>
            </div>

            <div className="ga-thread">
              <div className="ga-bubble ga-bubble-user">Best hidden beach near Palolem?</div>
              <div className="ga-bubble ga-bubble-ai">
                Rajbaug &mdash; locals go, tourists don&rsquo;t yet.
                <span className="ga-bubble-meta">
                  <MapPin size={12} strokeWidth={2} />
                  12 min drive &middot; quiet at sunset
                </span>
              </div>
            </div>

            <div className="ga-chips">
              {GUIDE_PROMPTS.map((prompt) => (
                <button key={prompt} className="ga-chip" onClick={() => navigate("/goaguide")}>
                  {prompt}
                </button>
              ))}
            </div>

            {/* Styled like an input but it's a button — GoaGuide has no way to
                receive an opening question, so a real field would drop what
                you typed on the way there. */}
            <button className="ga-ask" onClick={() => navigate("/goaguide")}>
              <span className="ga-ask-placeholder">Ask GoaGuide anything&hellip;</span>
              <span className="ga-ask-send"><ArrowUp size={17} strokeWidth={2.5} /></span>
            </button>
          </div>
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
