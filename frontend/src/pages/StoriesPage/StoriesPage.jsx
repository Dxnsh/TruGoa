import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStoryBySlug } from "../../services/api";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import "./storiesPage.css";

export default function StoriesPage() {
  const { slug } = useParams();
  const navigate  = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setStory(null);

    getStoryBySlug(slug)
      .then((data) => { if (!cancelled) setStory(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-loading-ring" />
        <p className="sp-loading-text">Gathering the story…</p>
      </div>
    );
  }

  if (notFound || !story) return (
    <div className="sp-notfound">
      <div className="sp-notfound-inner">
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

  // Only show the first couple of stories as cards — keeps this page a
  // simple pointer to the full pieces instead of a page that needs its
  // own content maintained.
  const featured = story.stories.slice(0, 2);

  return (
    <div className="sp-root">
      <SEO
        path={`/stories/${slug}`}
        title={story.title}
        description={story.desc?.slice(0, 160) || `${story.title} — stories and guides from ${story.category || "Goa"}, curated by TruGoa.`}
        image={story.image}
        type="article"
      />

      <section className="sp-hero">
        <div className="sp-hero-backdrop" style={{ backgroundImage: `url(${story.image})` }} />
        <div className="sp-hero-img" style={{ backgroundImage: `url(${story.image})` }} />
        <div className="sp-hero-veil" />
        <div className="sp-hero-content">
          <span className="sp-hero-eyebrow">{story.category}</span>
          <h1 className="sp-hero-title">{story.title}</h1>
        </div>
      </section>

      <section className="sp-opening">
        <div className="sp-opening-inner">
          <p className="sp-opening-text">
            {story.manifestoText1 || story.desc}
          </p>
        </div>
      </section>

      <section className="sp-grid-section">
        <h2 className="sp-grid-title">Read the Story</h2>

        {featured.length === 0 ? (
          <div className="sp-empty">
            <p className="sp-empty-title">Stories arriving soon.</p>
          </div>
        ) : (
          <div className="sp-story-grid">
            {featured.map((item, i) => (
              <article
                key={item.slug || i}
                className="sp-card"
                onClick={() => navigate(`/stories/${slug}/${item.slug}`)}
              >
                <div
                  className="sp-card-img"
                  style={{ backgroundImage: `url(${item.image || story.image})` }}
                />
                <div className="sp-card-body">
                  <h3 className="sp-card-title">{item.title}</h3>
                  <p className="sp-card-excerpt">{item.excerpt}</p>
                  <span className="sp-card-cta">Read →</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
