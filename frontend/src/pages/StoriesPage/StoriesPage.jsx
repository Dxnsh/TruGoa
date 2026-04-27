import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storiesData } from "../../Data/storiesData";
import "./storiesPage.css";

const useReveal = (threshold = 0.12) => {
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

export default function StoriesPage() {
  const { slug } = useParams();
  const navigate   = useNavigate();

  const [heroRef,      heroVisible     ] = useReveal(0.05);
  const [manifestoRef, manifestoVisible] = useReveal(0.1);
  const [gridRef,      gridVisible     ] = useReveal(0.08);
  const [hoveredCard, setHoveredCard]    = useState(null);

  const story = storiesData.find(s => s.slug === slug);

  if (!story) return (
    <div className="sp-notfound">
      <div className="sp-notfound-inner">
        <div className="sp-notfound-grain" />
        <p className="sp-notfound-eyebrow">404</p>
        <h1 className="sp-notfound-title">The road disappears here.</h1>
        <p className="sp-notfound-sub">
          Goa always reveals another path.<br />
          Perhaps this one doesn't exist yet.
        </p>
        <button className="sp-btn-gold" onClick={() => navigate("/")}>
          Return Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="sp-root">

      {/* ══════════════════════════════════════════
          CINEMATIC HERO
      ══════════════════════════════════════════ */}
      <section className="sp-hero" ref={heroRef}>
        <div
          className="sp-hero-img"
          style={{ backgroundImage: `url(${story.image})` }}
        />
        {/* Multi-layer gradient — dark bottom, atmospheric */}
        <div className="sp-hero-veil" />
        {/* Film grain */}
        <div className="sp-grain" />

        {/* Top meta */}
        <div className="sp-hero-meta">
          <span className="sp-hero-meta-label">TruGoa Editorial</span>
        </div>

        {/* Bottom-anchored headline */}
        <div className={`sp-hero-content reveal-up ${heroVisible ? "visible" : ""}`}>
          <div className="sp-hero-eyebrow">
            
            {story.readTime && <span className="sp-read-time">{story.readTime} read</span>}
          </div>

          <h1 className="sp-hero-title">{story.title}</h1>
          <p className="sp-hero-desc">{story.desc}</p>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          OPENING PULL-QUOTE — the emotional anchor
      ══════════════════════════════════════════ */}
      <section className="sp-opening">
        <div className={`sp-opening-inner reveal-up ${heroVisible ? "visible" : ""}`}
          style={{ transitionDelay: "0.3s" }}>
          <div className="sp-opening-rule" />
          <blockquote className="sp-opening-quote">
            "These are not tourist checklists.<br />
            These are the places that shaped memories,<br />
            mornings and meaning."
          </blockquote>
          <div className="sp-opening-rule" />
        </div>
      </section>


      {/* ══════════════════════════════════════════
          MANIFESTO + STATS
      ══════════════════════════════════════════ */}
      <section className="sp-manifesto" ref={manifestoRef}>
        <div className={`sp-manifesto-grid reveal-up ${manifestoVisible ? "visible" : ""}`}>

          {/* Left — editorial manifesto */}
          <div className="sp-manifesto-left">
            <p className="sp-eyebrow-dark">
                {story.manifestoTitle || "Why This Matters"}
            </p>

            <p className="sp-manifesto-body">
             {story.manifestoText1}
            </p>

             <p
                className="sp-manifesto-body"
                style={{ marginTop: 20 }}
            >
                {story.manifestoText2}
            </p>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          STORY GRID
      ══════════════════════════════════════════ */}
      <section className="sp-grid-section" ref={gridRef}>

        <div className={`sp-grid-header reveal-up ${gridVisible ? "visible" : ""}`}>
          <p className="sp-eyebrow-dark">Read the Collection</p>
          <h2 className="sp-grid-title">Real Stories of Goa</h2>
          <p className="sp-grid-sub">
            {story.stories.length} piece{story.stories.length !== 1 ? "s" : ""} written
            for the traveller who wants more than a postcard.
          </p>
        </div>

        {story.stories.length === 0 ? (
          <div className={`sp-empty reveal-up ${gridVisible ? "visible" : ""}`}
            style={{ transitionDelay: "0.2s" }}>
            <div className="sp-empty-icon">🌴</div>
            <p className="sp-empty-title">Stories arriving soon.</p>
            <p className="sp-empty-sub">
              Our editors are in Goa right now, finding them.
            </p>
          </div>
        ) : (
          <div className="sp-story-grid">
            {story.stories.map((item, i) => (
              <article
                key={i}
                className={`sp-card reveal-up ${gridVisible ? "visible" : ""} ${
                  hoveredCard !== null && hoveredCard !== i ? "sp-card-dimmed" : ""
                }`}
                style={{ transitionDelay: `${0.08 + i * 0.1}s` }}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate(`/stories/${slug}/${item.slug}`)}
              >
                {/* Image */}
                <div className="sp-card-img-wrap">
                  <div
                    className="sp-card-img"
                    style={{ backgroundImage: `url(${item.image || story.image})` }}
                  />
                  {/* Hover reveal overlay */}
                  <div className="sp-card-hover-overlay">
                    <span className="sp-card-read-btn">Read Story →</span>
                  </div>
                  {/* Category tag */}
                  <div className="sp-card-tag">{story.category}</div>
                </div>

                {/* Body */}
                <div className="sp-card-body">
                  <div className="sp-card-meta">
                    <span className="sp-card-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.readTime && (
                      <span className="sp-card-readtime">{item.readTime} read</span>
                    )}
                  </div>

                  <h3 className="sp-card-title">{item.title}</h3>
                  <p className="sp-card-excerpt">{item.excerpt}</p>

                  {item.pullQuote && (
                    <div className="sp-card-pull">
                      <span className="sp-card-pull-mark">"</span>
                      <span className="sp-card-pull-text">{item.pullQuote.slice(0, 80)}…</span>
                    </div>
                  )}

                  <div className="sp-card-footer">
                    <span className="sp-card-cta">Read →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>


      {/* ══════════════════════════════════════════
          CLOSING MANIFESTO — emotional closer
      ══════════════════════════════════════════ */}
      <section className="sp-closer">
        <div className="sp-closer-bg" />
        <div className="sp-closer-grain" />
        <div className="sp-closer-content">
          <p className="sp-closer-eyebrow">TruGoa · Editorial</p>
          <h2 className="sp-closer-title">
            Goa is not a destination.<br />
            <em>It is a feeling.</em>
          </h2>
          <p className="sp-closer-sub">
            The light at 6am on a beach no one else has found yet.<br />
            The fish curry rice that tastes like everything a place can be.<br />
            The ferry that costs nothing and crosses to an island frozen in time.
          </p>
          <div className="sp-closer-actions">
            <button className="sp-btn-gold" onClick={() => navigate("/listings")}>
              Explore Verified Places
            </button>
            <button className="sp-btn-ghost" onClick={() => navigate("/goaguide")}>
              Ask GoaGuide AI
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}