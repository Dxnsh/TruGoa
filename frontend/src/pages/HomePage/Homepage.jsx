import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Waves, Landmark, UtensilsCrossed, Mountain, Music2, Flower2,
  ArrowRight, ChevronRight, MousePointer2, Menu,
  PenLine, BookOpen, Backpack, Camera, Bell, Search, SlidersHorizontal,
  Heart, Wind, MoreHorizontal, User, Palmtree, ArrowUp, LogOut,
} from "lucide-react";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import { CATEGORIES } from "../../constants/categories";
import DiscoverSwipe from "../../components/DiscoverSwipe/DiscoverSwipe";
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
  const [storiesRef, storiesVisible] = useScrollReveal();
  const [statsRef,   statsVisible  ] = useScrollReveal();

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
            <button
              className="hd-icon-btn"
              onClick={() => setShowMobileMenu(true)}
              aria-label="Open menu"
              aria-expanded={showMobileMenu}
            >
              <Menu size={20} strokeWidth={2} />
            </button>

            <div className="hd-logo-block">
              <span className="hd-eyebrow">Discover</span>
              <span className="hd-logo">
                <span className="hd-logo-tru">Tru</span><span className="hd-logo-goa">Goa</span>
              </span>
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
      <section ref={journeyRef} className="journey-way-section">
        <div className={`journey-way-wrap reveal ${journeyVisible ? "visible" : ""}`}
          style={{ flexDirection: isMobile ? "column" : "row" }}>
          <div className="split-left" style={{ maxWidth: 300 }}>
            <p className="journey-way-eyebrow">Plan Your Trip</p>
            <h2 className="split-heading">Your Goa Journey, Your Way</h2>
            <p className="split-body">
              Tell us what you love and we'll craft the perfect itinerary for you.
            </p>
            <button className="btn-dark-solid" onClick={() => navigate("/itinerary")}>
              Create My Itinerary <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="journey-way-steps">
            {JOURNEY_WAY_STEPS.map(({ Icon, title, desc }, i) => (
              <div key={title} className="journey-way-step">
                <div className="journey-way-circle"><Icon size={22} strokeWidth={1.6} /></div>
                {i < JOURNEY_WAY_STEPS.length - 1 && <span className="journey-way-line" />}
                <div className="journey-way-title">{title}</div>
                <div className="journey-way-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GOAGUIDE AI BANNER ════════════════════════════ */}
      <section className="goaguide-banner" onClick={() => navigate("/goaguide")}>
        <Palmtree className="gg-leaf" size={220} strokeWidth={1} aria-hidden="true" />

        <div className="gg-head">
          <span className="gg-head-avatar">G</span>
          <span className="gg-head-name">GoaGuide AI</span>
          <span className="gg-head-status">
            <span className="gg-head-dot" />
            Online
          </span>
        </div>

        <div className="gg-body">
          <h2 className="goaguide-banner-heading">
            Not just answers.<br />
            <span className="goaguide-banner-accent">A local friend.</span>
          </h2>

          <div className="goaguide-banner-chat">
            <div className="gg-bubble gg-bubble-user">Best hidden beach near Palolem?</div>
            <div className="gg-bubble gg-bubble-ai">
              Rajbaug &mdash; locals go, tourists don&rsquo;t yet.
            </div>

            {/* Styled like an input but it's a button — GoaGuide has no way to
                receive an opening question, so a real field would drop what
                you typed on the way there. */}
            <button
              className="gg-ask"
              onClick={(e) => { e.stopPropagation(); navigate("/goaguide"); }}
            >
              <span className="gg-ask-placeholder">Ask GoaGuide anything&hellip;</span>
              <span className="gg-ask-send"><ArrowUp size={17} strokeWidth={2.5} /></span>
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
