import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";
import { getTrendingPlaceBySlug } from "../../services/api";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";


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

  if (loading) return <div className="td-loading">Loading&hellip;</div>;

  if (notFound || !place) {
    return (
      <div className="td-notfound">
        <p>We couldn&rsquo;t find that place.</p>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="td-root">
      <SEO path={`/trending/${place.slug}`} title={place.title} description={place.description} />

      <button className="td-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} strokeWidth={2} /> Back
      </button>

      <div className="td-hero">
        <img src={place.image} alt={place.title} className="td-hero-img" />
        <span className="td-hero-badge">{place.badge}</span>
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
          Loved by <strong>{(place.lovedCount || 0).toLocaleString()}</strong> travellers this week
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TrendingDetail;