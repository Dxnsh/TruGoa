import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BizCard from "../../components/BizCard/BizCard";
import { getBusinesses } from "../../services/api";
import { mapBusiness } from "../../services/mapper.jsx";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { CATEGORIES, REVIEWS } from "../../Data/businesses";
import { editorialData } from "../../Data/editorialData.js";
import { storiesData } from "../../Data/storiesData.js";
import StarRating from "../../components/StarRating/StarRating";
import useIsMobile from "../../hooks/useIsMobile";
import "./homepage.css";
import {
  Sparkles,
  Utensils,
  Hotel,
  Coffee,
  Compass,
  Waves,
  ShoppingBag,
  ShipWheel,
  Church
} from "lucide-react";

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

// Per-category atmospheric gradients + accent colours
const CAT_STYLE = {
  "All":         { bg: "linear-gradient(150deg,#0C1E17,#1D3A28)", accent: "#F0B429" },
  "Restaurant": { bg: "linear-gradient(150deg,#2A1508,#4A2218)", accent: "#E8956D" },
  "Beaches":     { bg: "linear-gradient(150deg,#08182A,#0F2E4A)", accent: "#7EC8E3" },
  "Cafés":       { bg: "linear-gradient(150deg,#1E1208,#38240E)", accent: "#C8A876" },
  "Hotels":      { bg: "linear-gradient(150deg,#12101E,#22203A)", accent: "#B8A8D4" },
  "Activities":  { bg: "linear-gradient(150deg,#0A180A,#162E16)", accent: "#7EBC78" },
  "Markets":     { bg: "linear-gradient(150deg,#2E1608,#4A2A08)", accent: "#F0C849" },
};
const getCatStyle = (label) => CAT_STYLE[label] || CAT_STYLE["All"];

const iconMap = {
  sparkles: Sparkles,
  utensils: Utensils,
  hotel: Hotel,
  coffee: Coffee,
  compass: Compass,
  waves: Waves,
 "shopping-bag": ShoppingBag,
  "ship-wheel": ShipWheel,
  church: Church,
};


const Homepage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();
  const token = localStorage.getItem("trugoa_tourist_token");
  const user = localStorage.getItem("trugoa_tourist");

  const isLoggedIn = token && user;

 
    // localStorage.getItem("trugoa_admin_token");
  const isMobile = useIsMobile();

  const [editorialRef, editorialVisible] = useScrollReveal();
  const [catRef,       catVisible      ] = useScrollReveal();
  const [listRef,      listVisible     ] = useScrollReveal();
  const [trustRef,     trustVisible    ] = useScrollReveal();
  const [reviewRef,    reviewVisible   ] = useScrollReveal();

  const [businesses, setBusinesses] = useState([]);
  const [bizLoading, setBizLoading]  = useState(true);


 const categoryMap = {
  All: null,
  Restaurant: "restaurant",
  Cafés: "cafe",
  Hotels: "hotel",
  "Hotels & Stay": ["hotel", "stay"],
  Activities: "activity",
  Beaches: "beach",
  Markets: "market",
  "Water Sports": "watersports"
};

  const filtered =
  activeCategory === "All"
    ? businesses
    : businesses.filter(
        (b) =>
          b.category?.toLowerCase() === categoryMap[activeCategory]
      );

  useEffect(() => {
    (async () => {
      try {
        const data = await getBusinesses();
        setBusinesses(data.map((biz, i) => mapBusiness(biz, i)));
      } catch (err) {
        console.error("Failed to load businesses", err);
      } finally {
        setBizLoading(false);
      }
    })();
  }, []);

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="hp-root">

      {/* ══════════════════════════════════════════
          HERO — cinematic, bottom-anchored, editorial
      ══════════════════════════════════════════ */}
      <section
        className="hero"
        style={{ transform: isMobile ? "translateY(-25px)" : "translateY(-70px)" }}
      >
        {/* Background image */}
        <div className="hero-bg" />
        {/* Gradient: dark at bottom (text legibility), fades to transparent top */}
        <div className="hero-overlay" />
        {/* Film-grain texture */}
        <div className="grain" />

        {/* ── Top meta bar */}
        <div className="hero-meta" style={{ padding: isMobile ? "0 24px" : "0 64px" }}>
          <span className="hero-meta-text">GOA · INDIA</span>
          <span className="hero-meta-text">EST. 2025 · 500+ VERIFIED PLACES</span>
        </div>

        {/* ── Vertical label strip (desktop) */}
        {!isMobile && (
          <div className="hero-vstrip">
            NORTH GOA &nbsp;·&nbsp; SOUTH GOA &nbsp;·&nbsp; PANAJI &nbsp;·&nbsp; BEACHES &nbsp;·&nbsp; HERITAGE
          </div>
        )}

        {/* ── Main editorial content — sits above the location bar */}
        <div
          className="hero-content"
          style={{
            left:     isMobile ? 24 : 64,
            right:    isMobile ? 24 : "auto",
            bottom:   isMobile ? 88 : 96,
            maxWidth: isMobile ? "calc(100% - 48px)" : "56%",
          }}
        >
          {/* Eyebrow with gold rule */}
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-line" />
            <span className="hero-eyebrow-text">Trusted · Verified · Local</span>
          </div>

          {/* Headline — the centrepiece */}
          <h1 className="hero-h1"
            style={{ fontSize: isMobile ? "clamp(52px,14vw,76px)" : "clamp(82px,9vw,130px)" }}>
            Discover the
          </h1>
          <h1 className="hero-h1 hero-h1-gold"
            style={{ fontSize: isMobile ? "clamp(52px,14vw,76px)" : "clamp(82px,9vw,130px)" }}>
            soul of Goa.
          </h1>

          <p className="hero-sub" style={{ maxWidth: isMobile ? "100%" : 400 }}>
            The beaches locals swim at. The shacks with no signage.
            The Goa worth the flight.
          </p>

          <div className="hero-btns">
            <button className="btn-gold-solid" onClick={() => navigate("/listings")}>
              Explore Places
            </button>
            <button className="btn-ghost-white" onClick={() => navigate("/goaguide")}>
              Ask AI Guide
            </button>
          </div>
        </div>

        {/* ── Frosted bottom location bar */}
        <nav className="hero-locbar no-scrollbar">
          <span className="locbar-label">EXPLORE</span>
          <span className="locbar-rule" />
          {(isMobile
            ? ["North Goa", "South Goa", "Beaches","Restaurant", ]
            : ["North Goa", "South Goa", "Panaji", "Beaches", "Restaurant", "Cafés"]
          ).map(loc => (
            <span
              key={loc}
              className="locbar-item"
              onClick={() => navigate(`/listings?search=${encodeURIComponent(loc)}`)}
            >
              {loc}
            </span>
          ))}
        </nav>
      </section>


      {/* ══════════════════════════════════════════
          MARQUEE STRIP
      ══════════════════════════════════════════ */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {[...Array(2)].map((_, ri) =>
            ["✦ Verified Listings", "🌴 Local Insider Tips", "₹ Fair Price Checker",
             "✦ AI Travel Guide", "⚠ Scam Alerts", "500+ Places",
             "📍 All of Goa", "✦ North & South Goa"].map((item, i) => (
              <span key={`${ri}-${i}`} className="marquee-item">{item}</span>
            ))
          )}
        </div>
      </div>


      {/* ══════════════════════════════════════════
          EDITORIAL OPENING — manifesto, not "how it works"
      ══════════════════════════════════════════ */}
       <section
        ref={editorialRef}
        className="editorial-section"
        style={{ padding: isMobile ? "80px 24px" : "110px clamp(48px,7vw,120px)" }}
      >
      <div className={`reveal ${editorialVisible ? "visible" : ""}`}>

        {/* Header */}
        <div className="editorial-topbar">
        <h2 className="editorial-heading"> Where Goa Begins</h2>

      <div className="editorial-nav">
      <span
          onClick={() =>
            document
              .querySelector(".editorial-scroll")
              .scrollBy({ left: -420, behavior: "smooth" })
          }
        >
          <ChevronLeft size={50} strokeWidth={2} />
        </span>

      <span
          onClick={() =>
            document
              .querySelector(".editorial-scroll")
              .scrollBy({ left: 420, behavior: "smooth" })
          }
        >
          <ChevronRight size={50} strokeWidth={2} />
        </span>
      </div>
      </div>

        {/* Cards */}
        <div className="editorial-scroll">
         {editorialData.map((item) => (
          <article
            key={item.id}
            className="editorial-card"
            onClick={() => navigate(`/stories/${item.slug}`)}
            style={{ cursor: "pointer" }}
          >
            <img src={item.img} alt={item.title} className="editorial-image" />
            <p className="editorial-cat">{item.cat}</p>
            <h3 className="editorial-title">{item.title}</h3>
            <div className="editorial-line" />
            <p className="editorial-desc">{item.desc}</p>
          </article>
        ))}

        </div>
      </div>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORIES — atmospheric editorial cards
      ══════════════════════════════════════════ */}
      <section
        ref={catRef}
        style={{
          background: "linear-gradient(160deg,#07140C,#112210,#091810)",
          padding: isMobile ? "64px 0" : "80px 0",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: isMobile ? "0 24px 36px" : `0 clamp(48px,7vw,120px) 44px` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div className={`reveal ${catVisible ? "visible" : ""}`}>
              <p className="eyebrow-light">Choose Your Goa Experience</p>
              <h2 className="title-light"
                style={{ fontSize: isMobile ? 34 : "clamp(34px,4vw,56px)" }}>
                Where would you like to begin?
              </h2>
            </div>
            <span
              className={`link-gold reveal delay-2 ${catVisible ? "visible" : ""}`}
              onClick={() => navigate("/listings")}
            >
              View all places →
            </span>
          </div>
        </div>

        {/* Atmospheric category cards */}
        <div className="cat-scroll no-scrollbar"
          style={{ padding: isMobile ? "8px 24px 36px" : `8px clamp(48px,7vw,120px) 36px` }}>
          {CATEGORIES.map((c, i) => {
            const isActive = activeCategory === c.label;
            const cs = getCatStyle(c.label);
            const count =
              c.label === "All"
                ? businesses.length
                : businesses.filter(b => {
                    const map = categoryMap[c.label];

                    if (Array.isArray(map)) {
                      return map.includes(b.category?.toLowerCase());
                    }

                    return b.category?.toLowerCase() === map;
                  }).length;
            return (
              <div
                key={c.label}
                className={`cat-card reveal delay-${Math.min(i+1,5)} ${catVisible ? "visible" : ""} ${isActive ? "cat-card-active" : ""}`}
                onClick={() => setActiveCategory(c.label)}
                style={{
                  background: cs.bg,
                  borderColor: isActive ? cs.accent : "rgba(255,255,255,0.06)",
                  "--cat-accent": cs.accent,
                }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div className="cat-card-dot" style={{ background: cs.accent }} />
                )}
               <div className="cat-card-icon">
                  {(() => {
                    const Icon = iconMap[c.icon?.toLowerCase()];
                    return Icon ? (
                      <Icon size={28} stroke={isActive ? cs.accent : "#ffffff"} />
                    ) : (
                      c.icon
                    );
                  })()}
                </div>
                <div className="cat-card-name"
                  style={{ color: isActive ? cs.accent : "rgba(255,255,255,0.88)" }}>
                  {c.label}
                </div>
                <div className="cat-card-count">{count} curated spots</div>
              </div>
            );
          })}
        </div>
      </section>


      {/* ══════════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════════ */}
      <section
        ref={listRef}
        style={{
          background: "#F8F4EE",
          padding: isMobile ? "64px 24px" : `80px clamp(48px,7vw,120px)`,
        }}
      >
        {/* Header */}
        <div className={`listings-header reveal ${listVisible ? "visible" : ""}`}>
          <div className="listings-rule" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 52 }}>
            <div>
              <p className="eyebrow-dark">
                {activeCategory === "All" ? "Featured Places" : activeCategory}
              </p>
              <h2 className="title-dark"
                style={{ fontSize: isMobile ? 34 : "clamp(34px,4vw,56px)" }}>
                Personally verified by locals
              </h2>
            </div>
            
              {filtered.length > 5 && (
                <button
                  className="btn-dark-solid"
                  onClick={() => navigate("/listings")}
                >
                  View all →
                </button>
              )}
                      
          </div>
        </div>

        {/* Grid — loading / results / empty */}
        {bizLoading ? (
          <div className="skeleton-grid"
            style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))" }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))",
            gap: isMobile ? 18 : 28,
          }}>
            {filtered.slice(0,5).map((b, i) => (
              <div
                key={b.id || b.id}
                className={`reveal biz-card-wrap delay-${Math.min(i+1,5)} ${listVisible ? "visible" : ""}`}
              >
                <BizCard biz={b} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🌴</div>
            <h3 className="empty-title">No {activeCategory} listed yet</h3>
            <p className="empty-body">We're still verifying places in this category. Check back soon.</p>
            <button className="btn-green-solid" onClick={() => setActiveCategory("All")}>
              Show all places
            </button>        
          </div>
        )}
      </section>


      {/* ══════════════════════════════════════════
          AI GUIDE CTA
      ══════════════════════════════════════════ */}
      <section
        style={{
          background: "linear-gradient(140deg,#05100A,#0F2418,#081910)",
          padding: isMobile ? "80px 24px" : `100px clamp(48px,7vw,120px)`,
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Glow orb */}
        <div className="ai-orb" />

        <div className="ai-inner" style={{ flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ maxWidth: 540 }}>
            <div className="ai-badge">
              <span>🤖</span>
              <span>Powered by Claude AI</span>
            </div>
            <h2 className="title-light"
              style={{ fontSize: isMobile ? 34 : "clamp(38px,4vw,62px)", marginBottom: 20 }}>
              Ask GoaGuide AI anything about Goa
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.48)", lineHeight: 1.85, marginBottom: 40 }}>
              Fair taxi prices. Best hidden beaches. Scam warnings. Budget itineraries.
              Your personal Goa travel expert — available 24/7.
            </p>
            <button className="btn-gold-solid" onClick={() => navigate("/goaguide")}>
              Chat with GoaGuide AI →
            </button>
            <div className="ai-chips">
              {["Fair airport taxi price?", "Hidden gems in Goa?", "3-day budget plan?"].map(q => (
                <button key={q} className="ai-chip" onClick={() => navigate("/goaguide")}>{q}</button>
              ))}
            </div>
          </div>

          {/* Chat preview (desktop) */}
          {!isMobile && (
            <div className="ai-chat-card">
              {[
                { role: "user", text: "What's the fair taxi price from the airport to Baga?" },
                { role: "ai",   text: "The fair rate is ₹900–₹1,100. Always use the pre-paid counter inside the airport — outside drivers quote 2–3× more." },
                { role: "user", text: "Any hidden beaches nearby?" },
              ].map((msg, i) => (
                <div key={i} className={`chat-row chat-row-${msg.role}`}>
                  {msg.role === "ai" && <div className="chat-avatar">🌴</div>}
                  <div className={`chat-bubble chat-bubble-${msg.role}`}>{msg.text}</div>
                </div>
              ))}
              {/* Typing indicator */}
              <div className="chat-row chat-row-ai">
                <div className="chat-avatar">🌴</div>
                <div className="chat-bubble chat-bubble-ai chat-typing">
                  {[0,1,2].map(i => (
                    <span key={i} className="dot" style={{ animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* ══════════════════════════════════════════
          WHY TRUGOA — editorial manifesto layout
      ══════════════════════════════════════════ */}
      <section
        ref={trustRef}
        style={{
          background: "#F8F4EE",
          padding: isMobile ? "80px 24px" : `100px clamp(48px,7vw,120px)`,
        }}
      >
        <div
          className={`trust-wrap reveal ${trustVisible ? "visible" : ""}`}
          style={{ flexDirection: isMobile ? "column" : "row" }}
        >
          {/* Left manifesto */}
          <div className="trust-left">
            <p className="eyebrow-dark">Why TruGoa</p>
            <h2 className="title-dark trust-headline"
              style={{ fontSize: isMobile ? 38 : "clamp(40px,4.5vw,68px)" }}>
              Built to protect tourists,<br />
              <em>not exploit them.</em>
            </h2>
            <p className="trust-body">
              In a destination where every traveller is a target, TruGoa runs on one idea:
              the best experience comes from honest information. No commissions.
              No paid rankings. Just Goa as it actually is.
            </p>
          </div>

          {/* Right pillars — 2×2 grid */}
          <div className="trust-pillars">
            {[
              { glyph: "✦", title: "No Paid Listings",  desc: "Every business earns its place through verification — never payment.",   bg: "#EEF5F1" },
              { glyph: "◈", title: "AI-Powered",         desc: "Our AI knows taxi prices, hidden spots, seasonal tips and scam alerts.",  bg: "#FEF8E8" },
              { glyph: "₹", title: "Fair Prices",        desc: "See exactly what you should pay. Never get overcharged again.",           bg: "#FDF0E6" },
              { glyph: "✿", title: "Local-First",        desc: "Real Goa residents contribute tips. Not influencers. Not algorithms.",    bg: "#EEF5F1" },
            ].map((t, i) => (
              <div
                key={t.title}
                className={`trust-pillar reveal delay-${i+1} ${trustVisible ? "visible" : ""}`}
                style={{ background: t.bg }}
              >
                <div className="trust-glyph">{t.glyph}</div>
                <div className="trust-title">{t.title}</div>
                <div className="trust-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          REVIEWS — literary pull-quote style
      ══════════════════════════════════════════ */}
      <section
        ref={reviewRef}
        style={{
          background: "#0A1F12",
          padding: isMobile ? "80px 24px" : `100px clamp(48px,7vw,120px)`,
        }}
      >
        <div className={`reveal ${reviewVisible ? "visible" : ""}`} style={{ marginBottom: 64 }}>
          <p className="eyebrow-light">Real Reviews</p>
          <h2 className="title-light"
            style={{ fontSize: isMobile ? 34 : "clamp(34px,4vw,56px)" }}>
            What they said after
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(300px,1fr))",
          gap: isMobile ? 20 : 28,
        }}>
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              className={`review-card reveal delay-${Math.min(i+1,4)} ${reviewVisible ? "visible" : ""}`}
            >
              {/* Decorative open-quote */}
              <div className="review-openquote">"</div>
              <div className="review-stars"><StarRating rating={r.rating} /></div>
              <p className="review-text">{r.text}</p>
              <div className="review-rule" />
              <div className="review-author">
                <div className="review-avatar">{r.name[0]}</div>
                <div>
                  <div className="review-name">{r.name}</div>
                  <div className="review-meta">📍 {r.city} · {r.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════════
          CTA STRIP
      ══════════════════════════════════════════ */}
      {!isLoggedIn && (
      <div
        className="cta-strip"
        style={{ padding: isMobile ? "48px 24px" : `64px clamp(48px,7vw,120px)` }}
      >
        <div>
          <h3 className="cta-heading" style={{ fontSize: isMobile ? 28 : 42 }}>
            Own a business in Goa?
          </h3>
          <p className="cta-sub">List it free. Reach thousands of tourists every month.</p>
        </div>
        <button className="btn-dark-solid cta-btn" onClick={() => navigate("/auth")}>
          List Your Business →
        </button>
      </div>
      )}

      <footer
        className="footer"
        style={{ padding: isMobile ? "40px 24px" : `48px clamp(48px,7vw,120px)` }}
      >
        <div className="footer-top">
          <div>
            <div className="footer-logo">
              <span style={{ color: "#2D6A4F" }}>Tru</span>
              <span style={{ color: "#F0B429" }}>Goa</span>
            </div>
            <div className="footer-issue">Issue 01 · Goa, India · Est. 2026</div>
          </div>

          <div className="footer-links">
            {[
              ["Explore", "/listings"],
              ["AI Guide", "/goaguide"],
              ...(!isLoggedIn ? [["List your Business", "/auth"]] : [])    
            ].map(([label, path]) => (
              <span 
              key={label} 
              className="footer-link" 
              onClick={() => navigate(path)}
              style={{
                cursor:"pointer",
                fontWeight:
                 label === "List your  Business"
                  ? 600
                  : 400
              }}
              
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="footer-rule" />
        <div className="footer-bottom">
          <span>© 2026 TruGoa · Curating the soul of Goa</span>
          <span>Trusted journeys begin here</span>
        </div>
      </footer>


      {/* ══════════════════════════════════════════
          FLOATING AI BUTTON
      ══════════════════════════════════════════ */}
      {!isMobile && (
        <button className="fab-ai" onClick={() => navigate("/goaguide")}>
          🌴 Ask GoaGuide AI
        </button>
      )}

    </div>
  );
};

export default Homepage;