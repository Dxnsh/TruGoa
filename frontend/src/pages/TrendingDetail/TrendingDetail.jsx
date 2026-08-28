import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft, Heart } from "lucide-react";
import { getTrendingPlaceBySlug } from "../../services/api";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import "./trendingDetails.css"

const TrendingDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getTrendingPlaceBySlug(slug)
      .then((data) => { if (!cancelled) setPlace(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="td-loading">
        <span className="td-loading-dot" />
        <p>Finding this place&hellip;</p>
      </div>
    );
  }

  if (notFound || !place) {
    return (
      <div className="td-notfound">
        <span className="td-notfound-eyebrow">Not found</span>
        <p>We couldn&rsquo;t find that place — it may have moved, or the trail ends here.</p>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="td-root">
      <SEO path={`/trending/${place.slug}`} title={place.title} description={place.description} />

      <div className="td-hero">
        <img src={place.image} alt={place.title} className="td-hero-img" />
        <div className="td-hero-gradient" />
        {place.badge && <span className="td-hero-badge">{place.badge}</span>}
      </div>

      <div className="td-body">
        <span className="td-loc">
          <MapPin size={14} strokeWidth={2} /> {place.location}
        </span>
        <h1 className="td-title">{place.title}</h1>
        <p className="td-desc">{place.longDescription || place.description}</p>

        {place.gallery?.length > 0 && (
          <div className="td-gallery">
            {place.gallery.map((src, i) => (
              <img key={i} src={src} alt={`${place.title} ${i + 1}`} />
            ))}
          </div>
        )}

        <div className="td-loved">
          <Heart size={14} strokeWidth={2} fill="currentColor" />
          Loved by <strong>{(place.lovedCount || 0).toLocaleString()}</strong> travellers this week
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TrendingDetail;