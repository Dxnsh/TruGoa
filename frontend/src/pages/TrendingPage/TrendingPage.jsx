import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart, TrendingUp } from "lucide-react";
import { getTrendingPlaces } from "../../services/api";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import "./trendingPage.css";

const TrendingPage = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getTrendingPlaces()
      .then((data) => { if (!cancelled) setPlaces(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="tp-loading">
        <span className="tp-loading-dot" />
        <p>Finding what&rsquo;s trending&hellip;</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tp-notfound">
        <span className="tp-notfound-eyebrow">Something went wrong</span>
        <p>We couldn&rsquo;t load trending places right now. Please try again shortly.</p>
      </div>
    );
  }

  return (
    <div className="tp-root">
      <SEO
        path="/trending"
        title="Trending in Goa"
        description="The places travellers are discovering in Goa right now — verified, unsponsored, and picked by people who live here."
      />

      <div className="tp-header">
        <span className="tp-eyebrow">
          <TrendingUp size={14} strokeWidth={2} /> Trending
        </span>
        <h1 className="tp-title">What&rsquo;s trending in Goa</h1>
        <p className="tp-subtitle">
          The places travellers are discovering right now — verified, unsponsored, and picked by people who live here.
        </p>
      </div>

      {places.length === 0 ? (
        <div className="tp-empty">
          <p>Nothing trending just yet — check back soon.</p>
        </div>
      ) : (
        <div className="tp-grid">
          {places.map((place) => (
            <Link to={`/trending/${place.slug}`} key={place.slug} className="tp-card">
              <div className="tp-card-img-wrap">
                <img src={place.image} alt={place.title} className="tp-card-img" />
                <div className="tp-card-gradient" />
                {place.badge && <span className="tp-card-badge">{place.badge}</span>}
              </div>
              <div className="tp-card-body">
                <span className="tp-card-loc">
                  <MapPin size={13} strokeWidth={2} /> {place.location}
                </span>
                <h3 className="tp-card-title">{place.title}</h3>
                <p className="tp-card-desc">{place.description}</p>
                <div className="tp-card-loved">
                  <Heart size={13} strokeWidth={2} fill="currentColor" />
                  <strong>{(place.lovedCount || 0).toLocaleString()}</strong> loved this week
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default TrendingPage;