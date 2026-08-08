import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin, Heart, Share2, ChevronRight, Plane, TrainFront,
} from "lucide-react";
import { getStoryBySlug } from "../../services/api";
import Footer from "../../components/Footer/Footer";
import SEO, { SITE_URL } from "../../components/SEO/SEO";
import "./storyArticlePage.css";

const INTRO_PREVIEW_LEN = 340;

export default function StoryArticlePage() {
  const { slug, storySlug } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [introExpanded, setIntroExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setIntroExpanded(false);

    getStoryBySlug(slug)
      .then((data) => { if (!cancelled) setCollection(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug, storySlug]);

  if (loading) {
    return (
      <div className="sa-loading">
        <div className="sa-loading-ring" />
        <p className="sa-loading-text">Gathering the story…</p>
      </div>
    );
  }

  const article = collection?.stories?.find((s) => s.slug === storySlug);

  if (notFound || !collection || !article) return (
    <div className="sa-notfound">
      <div className="sa-notfound-inner">
        <p className="sa-notfound-eyebrow">404</p>
        <h1 className="sa-notfound-title">The road disappears here.</h1>
        <p className="sa-notfound-sub">
          Goa always reveals another path.<br />
          Perhaps this one doesn't exist yet.
        </p>
        <button className="sa-btn-gold" onClick={() => navigate("/")}>
          Return Home
        </button>
      </div>
    </div>
  );

  const siblings = collection.stories.filter((s) => s.slug !== storySlug);
  const hasIntro = !!article.introBody;
  const introLong = hasIntro && article.introBody.length > INTRO_PREVIEW_LEN;
  const introText = introLong && !introExpanded
    ? article.introBody.slice(0, INTRO_PREVIEW_LEN).trim() + "…"
    : article.introBody;

  const hasMap = article.latitude && article.longitude;
  const mapEmbedSrc = hasMap
    ? `https://www.google.com/maps?q=${article.latitude},${article.longitude}&z=13&output=embed`
    : article.location
    ? `https://www.google.com/maps?q=${encodeURIComponent(article.location)}&z=12&output=embed`
    : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || article.introBody?.slice(0, 160),
    image: article.image || collection.image,
    url: `${SITE_URL}/stories/${slug}/${storySlug}`,
    articleSection: collection.category,
  };

  return (
    <div className="sa-root">
      <SEO
        path={`/stories/${slug}/${storySlug}`}
        title={article.title}
        description={article.excerpt || article.introBody?.slice(0, 160) || `${article.title} — a TruGoa story from ${collection.category}.`}
        image={article.image || collection.image}
        type="article"
        jsonLd={articleJsonLd}
      />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <div className="sa-hero">
        <div className="sa-hero-backdrop" style={{ backgroundImage: `url(${article.image || collection.image})` }} />
        <div className="sa-hero-img" style={{ backgroundImage: `url(${article.image || collection.image})` }} />
        <div className="sa-hero-veil" />

        <div className="sa-hero-content">
          <div className="sa-breadcrumb">
            <span onClick={() => navigate("/")}>Home</span>
            <ChevronRight size={12} />
            <span onClick={() => navigate("/stories/" + slug)}>{collection.category}</span>
            <ChevronRight size={12} />
            <span className="sa-breadcrumb-current">{article.title}</span>
          </div>

          <p className="sa-hero-eyebrow">{collection.category}</p>
          <h1 className="sa-hero-title">{article.title}</h1>
          {article.excerpt && <p className="sa-hero-excerpt">{article.excerpt}</p>}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          THE STORY — text left, map + essentials aside
      ══════════════════════════════════════════ */}
      {(article.introTitle || hasIntro || article.pullQuote || mapEmbedSrc) && (
        <section className="sa-story">
          <div className="sa-story-left">
            {article.introTitle && <h2 className="sa-intro-title">{article.introTitle}</h2>}
            {hasIntro && (
              <>
                <p className="sa-intro-body">{introText}</p>
                {introLong && (
                  <button className="sa-readmore" onClick={() => setIntroExpanded((e) => !e)}>
                    {introExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </>
            )}
            {article.pullQuote && (
              <blockquote className="sa-pullquote">"{article.pullQuote}"</blockquote>
            )}
          </div>

          <aside className="sa-story-side">
            {mapEmbedSrc && (
              <div className="sa-map-card">
                <iframe title="location" src={mapEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}

            {(article.nearestAirport || article.nearestRailway) && (
              <div className="sa-quickinfo-card">
                {article.nearestAirport && (
                  <div className="sa-quickinfo-row">
                    <span className="sa-quickinfo-label"><Plane size={13} /> Nearest Airport</span>
                    <span className="sa-quickinfo-value">{article.nearestAirport}</span>
                  </div>
                )}
                {article.nearestRailway && (
                  <div className="sa-quickinfo-row">
                    <span className="sa-quickinfo-label"><TrainFront size={13} /> Nearest Railway Station</span>
                    <span className="sa-quickinfo-value">{article.nearestRailway}</span>
                  </div>
                )}
              </div>
            )}

            {article.location && (
              <div className="sa-side-row">
                <MapPin size={15} />
                <span>{article.location}</span>
              </div>
            )}

            <div className="sa-story-actions">
              <button className={`sa-story-action ${saved ? "active" : ""}`} onClick={() => setSaved((s) => !s)}>
                <Heart size={16} fill={saved ? "currentColor" : "none"} />
              </button>
              <button
                className="sa-story-action"
                onClick={() => {
                  if (navigator.share) navigator.share({ title: article.title, url: window.location.href }).catch(() => {});
                  else navigator.clipboard?.writeText(window.location.href);
                }}
              >
                <Share2 size={16} />
              </button>
            </div>
          </aside>
        </section>
      )}

      {/* ══════════════════════════════════════════
          UNIQUE EXPERIENCES
      ══════════════════════════════════════════ */}
      {article.activities?.length > 0 && (
        <section className="sa-activities">
          <p className="sa-section-kicker">Indulge In</p>
          <h2 className="sa-section-giant">Unique Experiences</h2>

          <div className="sa-activities-grid">
            {article.activities.map((a, i) => (
              <div key={i} className="sa-activity-card" style={{ backgroundImage: `url(${a.image})` }}>
                <div className="sa-activity-veil" />
                <div className="sa-activity-body">
                  <h3>{a.title}</h3>
                  <p>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          MORE FROM THIS COLLECTION
      ══════════════════════════════════════════ */}
      {siblings.length > 0 && (
        <section className="sa-nearby">
          <h2 className="sa-section-giant sa-section-giant-outline">Explore More</h2>

          <div className="sa-nearby-scroller no-scrollbar">
            {siblings.map((s) => (
              <div
                key={s.slug}
                className="sa-nearby-card"
                style={{ backgroundImage: `url(${s.image || collection.image})` }}
                onClick={() => navigate(`/stories/${slug}/${s.slug}`)}
              >
                <div className="sa-nearby-veil" />
                <span className="sa-nearby-title">{s.title}</span>
              </div>
            ))}
          </div>

          <button className="sa-btn-gold" onClick={() => navigate(`/stories/${slug}`)}>
            View All {collection.category}
          </button>
        </section>
      )}

      <Footer />
    </div>
  );
}
