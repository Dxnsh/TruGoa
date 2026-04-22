import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BizCard from "../../components/BizCard/BizCard";
import { getBusinesses } from "../../services/api";
import { mapBusiness } from "../../services/mapper";
import { CATEGORIES, REVIEWS } from "../../Data/businesses";
import StarRating from "../../components/StarRating/StarRating";
import useIsMobile from "../../hooks/useIsMobile";
import { Search, MapPin, Coffee, Waves, Shield } from "lucide-react";
import "./homepage.css";


// ── animation helper ─────────────────────────────────────────
const useScrollReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const Homepage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [heroRef, heroVisible] = useScrollReveal();
  const [catRef, catVisible] = useScrollReveal();
  const [listRef, listVisible] = useScrollReveal();
  const [trustRef, trustVisible] = useScrollReveal();
  const [reviewRef, reviewVisible] = useScrollReveal();

  const [businesses, setBusinesses] = useState([]);
  const [bizLoading, setBizLoading] = useState(true);

  // ── FIX 2: filtered always uses businesses array (no CATEGORIES fallback)
  const filtered = activeCategory === "All"
    ? businesses
    : businesses.filter(b =>
        b.category?.toLowerCase().includes(
          activeCategory.replace(/s$/, "").toLowerCase()
        )
      );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/listings");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBusinesses();
        const mapped = data.map((biz, index) => mapBusiness(biz, index));
        setBusinesses(mapped);
      } catch (err) {
        console.error("Failed to load businesses", err);
      } finally {
        setBizLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
   <div className="homepage-root" >
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign:"left",
        justifyContent: "center",
        transform: "translateY(-65px)",
        overflow: "hidden",
        backgroundImage: `
          linear-gradient(
          rgba(0,0,0,0.45),
          rgba(0,0,0,0.58)
          ),
          url("/images/Hero-img.jpg")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",

          transform: isMobile
          ? "translateY(-25px)"
          : "translateY(-70px)"
      }}>

        {/* animated color blobs */}
        {/* <div style={{
          position: "absolute", width: 600, height: 600,
          top: "-10%", left: "-5%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,106,79,0.35) 0%, transparent 70%)",
          animation: "blob1 8s ease-in-out infinite", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 500, height: 500,
          bottom: "-10%", right: "-5%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(240,180,41,0.18) 0%, transparent 70%)",
          animation: "blob2 10s ease-in-out infinite", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400,
          top: "40%", left: "45%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,106,79,0.2) 0%, transparent 70%)",
          animation: "blob3 12s ease-in-out infinite", pointerEvents: "none",
        }} /> */}

        {/* giant GOA watermark */}
        {/* <div style={{
          position: "absolute",
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: isMobile ? "52vw" : "32vw",
          fontWeight: 700, color: "transparent",
          WebkitTextStroke: "1px rgba(240,180,41,0.08)",
          userSelect: "none", lineHeight: 1, pointerEvents: "none",
          letterSpacing: "-4px", animation: "shimmer 6s ease-in-out infinite",
        }}>
          GOA
        </div> */}

        {/* noise texture overlay */}
        {/* <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          pointerEvents: "none", opacity: 0.6,
        }} /> */}

        {/* ── FIX 3: floating category cards — onClick uses card.label ── */}
        {/* {!isMobile && [
          { emoji: "🍽️", label: "Restaurants", sub: "48 places", style: { top: "15%", left: "6%",  animation: "card-float-1 4s ease-in-out infinite" } },
          { emoji: "🏖️", label: "Beaches",     sub: "12 spots",  style: { top: "12%", right: "8%", animation: "card-float-2 4.5s ease-in-out infinite" } },
          { emoji: "☕", label: "Cafés",        sub: "24 spots",  style: { bottom: "22%", left: "4%",  animation: "card-float-3 5s ease-in-out infinite" } },
          { emoji: "🎯", label: "Activities",  sub: "30 things", style: { bottom: "18%", right: "5%", animation: "card-float-4 3.8s ease-in-out infinite" } },
          { emoji: "🛍️", label: "Markets",     sub: "8 markets", style: { top: "50%", left: "2%",  animation: "card-float-5 4.2s ease-in-out infinite" } },
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => navigate(`/listings?category=${encodeURIComponent(card.label)}`)}
            style={{
              position: "absolute", ...card.style,
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 18, padding: "14px 18px",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
              zIndex: 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(240,180,41,0.1)"; e.currentTarget.style.borderColor = "rgba(240,180,41,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>{card.emoji}</div>
            <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>{card.label}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{card.sub}</div>
          </div>
        ))} */}

        {/* ── center content ── */}
        <div style={{
          position: "relative", zIndex: 3,
          display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center",
          padding: isMobile ? "0 24px" : "0 48px",
          maxWidth: 720, width: "100%",
          marginTop:"10px",
        }}>
          {/* live pill */}
          {/* <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(240,180,41,0.1)",
            border: "1px solid rgba(240,180,41,0.25)",
            borderRadius: 50, padding: "7px 18px", marginBottom: 28,
          }}>
            <span className="hero-dot" style={{
              width: 7, height: 7, background: "#4ade80",
              borderRadius: "50%", display: "inline-block",
            }} />
            <span style={{ fontSize: 12, color: "#F0B429", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>
              Trusted by 50,000+ tourists
            </span>
          </div> */}

          {/* headline */}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? "clamp(48px,13vw,72px)" : "clamp(64px,7vw,108px)",
            fontWeight: 600, color: "white",
            lineHeight: 1.0, letterSpacing: "-2px", margin: "0 0 4px",
          }}>
            Discover the
          </h1>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? "clamp(48px,13vw,72px)" : "clamp(64px,7vw,108px)",
            fontWeight: 600, fontStyle: "italic",
            color: "#F0B429", lineHeight: 1.0,
            letterSpacing: "-2px", margin: "0 0 28px",
          }}>
            soul of Goa.
          </h1>

          

          {/* search bar */}
          {/* <div style={{
            background: "white", borderRadius: 20,
            padding: isMobile ? "6px 6px 6px 18px" : "10px 10px 10px 24px",
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", maxWidth: 560,
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,180,41,0.2)",
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 18, opacity: 0.4 }}>🔍</span>
            <input
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search restaurants, hotels, beaches..."
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: isMobile ? 14 : 15,
                color: "#1A1F1C", background: "transparent",
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                background: "linear-gradient(135deg, #2D6A4F, #1A5C38)",
                color: "white", border: "none", borderRadius: 14,
                padding: isMobile ? "12px 20px" : "14px 32px",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "'Instrument Sans', sans-serif",
                boxShadow: "0 4px 16px rgba(45,106,79,0.4)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #1A5C38, #0D3320)"}
              onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #2D6A4F, #1A5C38)"}
            >
              Search Goa
            </button>
          </div> */}

          {/* quick tags */}
          {/* <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {["🍽️ Restaurants", "🏖️ Beaches", "🎯 Activities", "☕ Cafés", "🛍️ Markets"].map(tag => (
              <button
                key={tag}
                onClick={() => navigate("/listings")}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.65)",
                  borderRadius: 50, padding: "8px 18px",
                  fontSize: 13, cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif",
                  transition: "all 0.2s", backdropFilter: "blur(8px)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(240,180,41,0.12)"; e.currentTarget.style.color = "#F0B429"; e.currentTarget.style.borderColor = "rgba(240,180,41,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                {tag}
              </button>
            ))}
          </div> */}
        </div>

        {/* scroll indicator */}
        {/* <div style={{
          position: "absolute", bottom: 32, left: "50%",
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 8, zIndex: 3,
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "2px", textTransform: "uppercase" }}>
            Scroll
          </span>
          <div style={{
            width: 1, height: 40,
            background: "linear-gradient(to bottom, rgba(240,180,41,0.4), transparent)",
            animation: "float 2s ease-in-out infinite",
          }} />
        </div> */}

        {/* bottom fade */}
        
      </div>


      
     {/* ── HOW IT WORKS ───────────────────────── */}
      <div
        ref={catRef}
        style={{
          margin:20,
          background: "#F7F3EC",
          padding: isMobile ? "64px 24px" : "110px clamp(40px,6vw,110px)",
        }}
      >
        {/* Heading */}
        <div
          className={`reveal ${catVisible ? "visible" : ""}`}
          style={{
            textAlign: "center",
            marginBottom: 70,
            maxWidth: 760,
            marginInline: "auto",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 18px",
              border: "1px solid rgba(0,0,0,.08)",
              borderRadius: 50,
              fontSize: 11,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#1A1F1C",
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            How TruGoa Works
          </div>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? 40 : "clamp(48px,4vw,72px)",
              lineHeight: 1,
              color: "#111",
              fontWeight: 600,
              marginBottom: 18,
            }}
          >
            The Smarter Way <br /> to Experience Goa
          </h2>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.8,
              color: "rgba(0,0,0,.62)",
            }}
          >
            Discover trusted places, avoid overpriced traps,
            and explore Goa beautifully.
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
          
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
            gap: 28,
          }}
        >
          {[
            {
              no: "01",
              title: "Discover Beautifully",
              desc: "Browse handpicked stays, dining, beaches and experiences across Goa.",
            },
            {
              no: "02",
              title: "Choose With Confidence",
              desc: "See verified listings, real photos and fair pricing before you go.",
            },
            {
              no: "03",
              title: "Travel Like a Local",
              desc: "Use insider tips and AI guidance to uncover the Goa most miss.",
            },
          ].map((item, i) => (
            <div
              key={item.no}
              className={`reveal delay-${i + 1} ${catVisible ? "visible" : ""}`}
              style={{
                background: "#fff",
                padding: isMobile ? 28 : 42,
                borderRadius: 26,
                border: "1px solid rgba(0,0,0,.06)",
                boxShadow: "0 12px 35px rgba(0,0,0,.04)",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 72,
                  color: "rgba(201,169,110,.18)",
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: 18,
                }}
              >
                {item.no}
              </div>

              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 30,
                  color: "#111",
                  lineHeight: 1.1,
                  marginBottom: 14,
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: "rgba(0,0,0,.62)",
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>


      {/* ── CATEGORIES ──────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#0C1E17,#132C22,#0B1814)", padding: isMobile ? "56px 0" : "72px 0", overflow: "hidden" }}>
        <div style={{ padding: isMobile ? "0 24px 32px" : `0 clamp(32px,6vw,96px) 40px` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{
                
                fontSize: 14, color: "#F0B429", fontWeight: 600,
                letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12,
              }}>
                Choose Your Goa Experience
              </div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: isMobile ? 32 : "clamp(32px,4vw,52px)",
                fontWeight: 600, color: "white", lineHeight: 1.1,
              }}>
                Where would you like to begin?
              </h2>
              
            </div>
            
            <span
              onClick={() => navigate("/listings")}
              style={{
                fontSize: 14, color: "#F0B429", fontWeight: 500,
                cursor: "pointer", borderBottom: "1px solid rgba(240,180,41,0.4)",
                paddingBottom: 2,
              }}
            >
              View all places →
            </span>
          </div>
        </div>

        {/* horizontal scroll strip — category chips only, no BizCard grid here */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex", gap: 16, overflowX: "auto",
            padding: isMobile ? "8px 24px 24px" : `8px clamp(32px,6vw,96px) 24px`,
          }}
        >
          {CATEGORIES.map((c, i) => {
            const isActive = activeCategory === c.label;
            return (
              <div
                key={c.label}
                className="cat-chip"
                onClick={() => setActiveCategory(c.label)}
                style={{
                  flexShrink: 0,
                  width: isMobile ? 130 : 160,
                  background: isActive ? "#F0B429" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${isActive ? "#F0B429" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 20, padding: "20px 16px",
                  cursor: "pointer", textAlign: "center",
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: isActive ? "#1A1F1C" : "rgba(255,255,255,0.8)",
                  marginBottom: 4,
                }}>
                  {c.label}
                </div>
                <div style={{
                  fontSize: 11,
                  color: isActive ? "rgba(26,31,28,0.6)" : "rgba(255,255,255,0.35)",
                }}>
                  {businesses.filter(b =>
                    c.label === "All" || b.category?.toLowerCase().includes(
                      c.label.replace(/s$/, "").toLowerCase()
                    )
                  ).length} places
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* ── FEATURED LISTINGS ───────────────────────────────── */}
      {/* FIX 1 & 4: ONE grid lives here inside listRef — no standalone grid above this */}
      <div
        ref={listRef}
        style={{
          background: "#F8F5EF",
          padding: isMobile ? "56px 24px" : `72px clamp(32px,6vw,96px)`,
        }}
      >
        <div className={`reveal ${listVisible ? "visible" : ""}`} style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{
              
              fontSize: 11, color: "#2D6A4F", fontWeight: 600,
              letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12,
            }}>
              {activeCategory === "All" ? "Featured Places" : activeCategory}
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: isMobile ? 32 : "clamp(32px,4vw,52px)",
              fontWeight: 600, color: "#1A1F1C", lineHeight: 1.1,
            }}>
              Personally verified by locals
            </h2>
          </div>
          <button
            onClick={() => navigate("/listings")}
            style={{
             background: "#10241B", color: "white",
              border: "none", borderRadius: 50,
              padding: "12px 28px", fontSize: 14,
              fontWeight: 600, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#2D6A4F"}
            onMouseLeave={e => e.currentTarget.style.background = "#1A1F1C"}
          >
            View all →
          </button>
        </div>

        {/* FIX 2: grid always uses filtered.map() — never falls back to CATEGORIES */}
        {bizLoading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: isMobile ? 16 : 24,
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: 320, borderRadius: 20,
                background: "linear-gradient(90deg, #e8e3d8 25%, #f0ece3 50%, #e8e3d8 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer-load 1.5s infinite",
              }} />
            ))}
            <style>{`
              @keyframes shimmer-load {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: isMobile ? 16 : 24,
          }}>
            {filtered.map((b, i) => (
              <div
                key={b.id}
                className={`reveal biz-card-wrap delay-${Math.min(i + 1, 5)} ${listVisible ? "visible" : ""}`}
              >
                <BizCard biz={b} />
              </div>
            ))}
          </div>
        ) : (
          /* Empty state — shown when category filter returns no results */
          <div style={{
            textAlign: "center", padding: "64px 24px",
            border: "2px dashed #D4CFC5", borderRadius: 24,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌴</div>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26, fontWeight: 600, color: "#1A1F1C",
              marginBottom: 8,
            }}>
              No {activeCategory} listed yet
            </h3>
            <p style={{ fontSize: 14, color: "#7A7068", marginBottom: 24 }}>
              We're still verifying businesses in this category. Check back soon!
            </p>
            <button
              onClick={() => setActiveCategory("All")}
              style={{
                background: "#2D6A4F", color: "white",
                border: "none", borderRadius: 50,
                padding: "12px 28px", fontSize: 14,
                fontWeight: 600, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              Show all places
            </button>
          </div>
        )}
      </div>


      {/* ── AI GUIDE CTA ────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0A1F12 0%, #1a4a2e 50%, #0d3320 100%)",
        padding: isMobile ? "56px 24px" : `80px clamp(32px,6vw,96px)`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", width: 400, height: 400,
          top: -100, right: -100, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(240,180,41,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap", gap: 32,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(240,180,41,0.12)",
              border: "1px solid rgba(240,180,41,0.25)",
              borderRadius: 50, padding: "6px 16px", marginBottom: 20,
            }}>
              <span style={{ fontSize: 14 }}>🤖</span>
              <span style={{ fontSize: 12, color: "#F0B429", fontWeight: 500 }}>Powered by Claude AI</span>
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: isMobile ? 32 : "clamp(36px,4vw,56px)",
              fontWeight: 600, color: "white",
              lineHeight: 1.1, marginBottom: 16,
            }}>
              Ask GoaGuide AI anything about Goa
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: 32 }}>
              Fair taxi prices. Best hidden beaches. Scam warnings. Budget itineraries.
              Your personal Goa travel expert available 24/7.
            </p>
            <button
              onClick={() => navigate("/goaguide")}
              style={{
                background: "#F0B429", color: "#1A1F1C",
                border: "none", borderRadius: 50,
                padding: "14px 32px", fontSize: 15,
                fontWeight: 700, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#D4960A"}
              onMouseLeave={e => e.currentTarget.style.background = "#F0B429"}
            >
              Chat with GoaGuide AI →
            </button>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
              {["Fair airport taxi price?", "Hidden gems in Goa?", "3-day budget plan?"].map(q => (
                <button
                  key={q}
                  onClick={() => navigate("/goaguide")}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.65)",
                    borderRadius: 50, padding: "7px 16px",
                    fontSize: 12, cursor: "pointer",
                    fontFamily: "'Instrument Sans', sans-serif",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* right side chat preview */}
          {!isMobile && (
            <div style={{
              width: 320,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24, padding: 24,
              backdropFilter: "blur(20px)",
            }}>
              {[
                { role: "user", text: "What's the fair taxi price from the airport to Baga?" },
                { role: "ai",   text: "The fair rate is ₹900–₹1100. Always use the pre-paid counter inside the airport — outside drivers quote 2–3x more." },
                { role: "user", text: "Any hidden beaches nearby?" },
              ].map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 12,
                }}>
                  {msg.role === "ai" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: "#F0B429",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, marginRight: 8, flexShrink: 0,
                    }}>🌴</div>
                  )}
                  <div style={{
                    maxWidth: "75%",
                    background: msg.role === "user" ? "rgba(45,106,79,0.4)" : "rgba(255,255,255,0.08)",
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    padding: "10px 14px", fontSize: 12,
                    color: msg.role === "user" ? "white" : "rgba(255,255,255,0.8)",
                    lineHeight: 1.5,
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {/* typing indicator */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: "#F0B429",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                }}>🌴</div>
                <div style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "14px 14px 14px 4px",
                  padding: "10px 16px",
                  display: "flex", gap: 4, alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#F0B429", display: "block",
                      animation: "float 1.2s ease-in-out infinite",
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ── WHY TRUGOA ──────────────────────────────────────── */}
      <div
        ref={trustRef}
        style={{
          background: "#FAFAF7",
          padding: isMobile ? "56px 24px" : `80px clamp(32px,6vw,96px)`,
        }}
      >
        <div className={`reveal ${trustVisible ? "visible" : ""}`} style={{ marginBottom: 48 }}>
          <div style={{
            fontSize: 11, color: "#2D6A4F", fontWeight: 600,
            letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12,
          }}>
            Why TruGoa
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? 32 : "clamp(32px,4vw,52px)",
            fontWeight: 600, color: "#1A1F1C", lineHeight: 1.1, maxWidth: 560,
          }}>
            Built to protect tourists, not exploit them.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? 16 : 24,
        }}>
          {[
            { icon: "✓",  title: "No Paid Listings",  desc: "Every business earns its place through verification — never by paying us.", color: "#E8F2EB", accent: "#2D6A4F" },
            { icon: "🧠", title: "AI-Powered",        desc: "Our AI knows Goa deeply — taxi prices, hidden spots, scam alerts.", color: "#FEF3C7", accent: "#92700A" },
            { icon: "💰", title: "Fair Prices",       desc: "See exactly what you should pay. Never get overcharged again.", color: "#FDE8D8", accent: "#8A3A1A" },
            { icon: "🌿", title: "Local-First",       desc: "Real Goa locals contribute tips and earn commissions — not influencers.", color: "#E8F2EB", accent: "#2D6A4F" },
          ].map((t, i) => (
            <div
              key={t.title}
              className={`reveal delay-${i + 1} ${trustVisible ? "visible" : ""}`}
              style={{
                background: t.color, borderRadius: 20,
                padding: isMobile ? 20 : 28,
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: isMobile ? 28 : 36, marginBottom: 14 }}>{t.icon}</div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? 16 : 20, fontWeight: 600,
                color: "#1A1F1C", marginBottom: 8, lineHeight: 1.2,
              }}>
                {t.title}
              </div>
              <div style={{ fontSize: 13, color: "#4A5550", lineHeight: 1.65 }}>
                {t.desc}
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* ── REVIEWS ─────────────────────────────────────────── */}
      <div
        ref={reviewRef}
        style={{
          background: "#0A1F12",
          padding: isMobile ? "56px 24px" : `80px clamp(32px,6vw,96px)`,
        }}
      >
        <div className={`reveal ${reviewVisible ? "visible" : ""}`} style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 11, color: "#F0B429", fontWeight: 600,
            letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12,
          }}>
            Real Reviews
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? 32 : "clamp(32px,4vw,52px)",
            fontWeight: 600, color: "white", lineHeight: 1.1,
          }}>
            What tourists say
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              className={`review-card reveal delay-${Math.min(i + 1, 4)} ${reviewVisible ? "visible" : ""}`}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, padding: 24,
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <StarRating rating={r.rating} />
              </div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 17, fontStyle: "italic",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.65, marginBottom: 20,
              }}>
                "{r.text}"
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "#F0B429",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 700, fontSize: 16, color: "#1A1F1C",
                }}>
                  {r.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>📍 {r.city} · {r.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* ── CTA STRIP ───────────────────────────────────────── */}
      <div style={{
        background: "#F0B429",
        padding: isMobile ? "40px 24px" : `56px clamp(32px,6vw,96px)`,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: 20,
      }}>
        <div>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMobile ? 26 : 36,
            fontWeight: 600, color: "#1A1F1C",
            lineHeight: 1.1, marginBottom: 6,
          }}>
            Own a business in Goa?
          </h3>
          <p style={{ fontSize: 14, color: "rgba(26,31,28,0.65)" }}>
            List it for free and reach thousands of tourists every month.
          </p>
        </div>
        <button
          onClick={() => navigate("/add-business")}
          style={{
            background: "#1A1F1C", color: "white",
            border: "none", borderRadius: 50,
            padding: "14px 32px", fontSize: 15,
            fontWeight: 700, cursor: "pointer",
            fontFamily: "'Instrument Sans', sans-serif",
            transition: "all 0.2s", whiteSpace: "nowrap",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#2D6A4F"}
          onMouseLeave={e => e.currentTarget.style.background = "#1A1F1C"}
        >
          List Your Business →
        </button>
      </div>


      {/* ── FOOTER ──────────────────────────────────────────── */}
      <div style={{
        background: "#070F09",
        padding: isMobile ? "32px 24px" : `40px clamp(32px,6vw,96px)`,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 16,
          paddingBottom: 24, marginBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 28, fontWeight: 600,
          }}>
            <span style={{ color: "#2D6A4F" }}>Tru</span>
            <span style={{ color: "#F0B429" }}>Goa</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["Explore", "/listings"], ["AI Guide", "/goaguide"], ["List Business", "/add-business"]].map(([label, path]) => (
              <span
                key={label}
                onClick={() => navigate(path)}
                style={{
                  fontSize: 14, color: "rgba(255,255,255,0.45)",
                  cursor: "pointer", transition: "color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "white"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>© 2025 TruGoa · Made with ❤️ in Goa</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>Protecting tourists since day one</div>
        </div>
      </div>


      {/* ── FLOATING AI BUTTON ─────────────────────────────── */}
      {!isMobile && (
        <button
          className="ai-float"
          onClick={() => navigate("/goaguide")}
          style={{
            position: "fixed", bottom: 32, right: 32,
            background: "#F0B429", color: "#1A1F1C",
            border: "none", borderRadius: 50,
            padding: "14px 22px", fontSize: 14, fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Instrument Sans', sans-serif",
            boxShadow: "0 8px 32px rgba(240,180,41,0.4)",
            display: "flex", alignItems: "center", gap: 8,
            zIndex: 500, transition: "box-shadow 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 12px 40px rgba(240,180,41,0.6)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(240,180,41,0.4)"}
        >
          🌴 Ask GoaGuide AI
        </button>
      )}

    </div>
  );
};

export default Homepage;