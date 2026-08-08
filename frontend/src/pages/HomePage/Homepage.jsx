import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Waves, Landmark, UtensilsCrossed, Mountain, Music2, Flower2,
  ArrowRight, ChevronRight, MapPin, MousePointer2, Menu,
  PenLine, BookOpen, Backpack, Camera,
} from "lucide-react";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import { getBusinesses, getStories } from "../../services/api";
import { mapBusiness } from "../../services/mapper";

import useIsMobile from "../../hooks/useIsMobile";
import "./homepage.css";

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
  { value: "700+", label: "Verified Places",     sub: "Handpicked by locals" },
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
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />

        

        <div className="hero-content" style={{ padding: isMobile ? "0 24px" : "0 64px" }}>
          <h1 className="hero-h1">
            Discover the <br />
            <span className="hero-h1-accent">soul of Goa.</span>
          </h1>
          <p className="hero-sub">
            Handpicked places. Honest stories. Real experiences. The true soul of Goa.
          </p>
       
        </div>

    
      </section>


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
        <div className="goaguide-banner-copy">
          <p className="eyebrow-light">GoaGuide AI</p>
          <h2 className="goaguide-banner-heading">Not just answers, a local friend.</h2>
          <p className="goaguide-banner-sub">
            Ask anything about Goa and get honest, expert answers instantly.
          </p>
          <button
            className="btn-primary-gold"
            onClick={(e) => { e.stopPropagation(); navigate("/goaguide"); }}
          >
            Chat with GoaGuide <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>

        {!isMobile && (
          <div className="goaguide-banner-chat">
            <div className="gg-bubble gg-bubble-user">Where can I eat authentic Goan fish?</div>
            <div className="gg-bubble gg-bubble-ai">
              <span className="gg-bubble-avatar">G</span>
              Try Souza Lobo in Calangute. Loved by locals for decades.
            </div>
            <div className="gg-bubble gg-bubble-user">Best hidden beach?</div>
            <div className="gg-bubble gg-bubble-ai">
              <span className="gg-bubble-avatar">G</span>
              Kakolem Beach in South Goa. Peaceful and untouched.
            </div>
          </div>
        )}

        {!isMobile && (
          <img src="/images/food.jpg" alt="Goan food" className="goaguide-banner-img" />
        )}
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
      <section ref={statsRef} className="stats-section">
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
      </section>

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
