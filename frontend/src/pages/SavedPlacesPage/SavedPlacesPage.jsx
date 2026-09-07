import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, ChevronRight, Map as MapIcon } from "lucide-react";
import { getFavorites, removeFavorite, getMyItinerary } from "../../services/api";
import { mapBusiness } from "../../services/mapper";
import { theme } from "../../Theme";
import { LoadingState, EmptyState, PrimaryButton } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";
import { useTourist } from "../../context/TouristContext";
import SEO from "../../components/SEO/SEO";

const SavedPlacesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isTouristLoggedIn, touristLoading } = useTourist();
  const [places, setPlaces] = useState([]);
  const [itinerary, setItinerary] = useState(null); // { form, data } or null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (touristLoading || !isTouristLoggedIn) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [favs, saved] = await Promise.all([
          getFavorites(),
          getMyItinerary().catch(() => null),
        ]);
        setPlaces(favs.map((b, i) => mapBusiness(b, i)));
        setItinerary(saved?.data ? saved : null);
      } catch {
        setError("Could not load your saved places. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [touristLoading, isTouristLoggedIn]);

  const unsave = async (id) => {
    setPlaces(prev => prev.filter(p => String(p.id) !== String(id))); // optimistic
    try {
      await removeFavorite(id);
    } catch {
      // best-effort — if this fails, it'll reappear next time favorites are fetched
    }
  };

  if (touristLoading) return null;

  if (!isTouristLoggedIn) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <Heart size={36} strokeWidth={1.5} color={theme.colors.textMuted} style={{ marginBottom: 16 }} />
          <h2 style={{ fontFamily: theme.typography.fontDisplay, fontSize: 24, fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: 10 }}>
            Sign in to see your saved places
          </h2>
          <p style={{ fontSize: 14, color: theme.colors.textMuted, lineHeight: 1.7, marginBottom: 24 }}>
            Save places you love from Explore and find them all here.
          </p>
          <PrimaryButton onClick={() => navigate("/explore")}>Browse Explore</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: theme.typography.fontBody, background: theme.colors.bgPage, minHeight: "100vh" }}>
      <SEO path="/saved" title="Saved" noindex />
      <div style={{ padding: isMobile ? "40px 16px 24px" : `56px ${theme.spacing.pagePadding} 32px` }}>
        <p style={{
          fontSize: 11, fontWeight: theme.typography.weightMedium, letterSpacing: "0.09em",
          textTransform: "uppercase", color: theme.colors.primary, margin: "0 0 8px",
        }}>
          Your Account
        </p>
        <h1 style={{
          fontFamily: theme.typography.fontDisplay, fontSize: isMobile ? 28 : 38,
          fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, margin: 0,
        }}>
          Saved
        </h1>
      </div>

      {loading && (
        <div style={{ padding: isMobile ? "0 16px 40px" : `0 ${theme.spacing.pagePadding} 40px` }}>
          <LoadingState message="Loading your saved places..." />
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 20 }}>{error}</div>
          <PrimaryButton onClick={() => window.location.reload()}>Try Again</PrimaryButton>
        </div>
      )}

      {!loading && !error && itinerary?.data && (
        <div style={{ padding: isMobile ? "0 16px 8px" : `0 ${theme.spacing.pagePadding} 8px` }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/itinerary")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/itinerary")}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: theme.colors.bgDark, color: "#fff",
              border: "none", borderRadius: theme.radii.lg || 16,
              padding: isMobile ? "18px 18px" : "22px 26px", cursor: "pointer",
              marginBottom: isMobile ? 28 : 36,
            }}
          >
            <span style={{
              flexShrink: 0, width: 42, height: 42, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MapIcon size={18} strokeWidth={2} />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{
                display: "block", fontSize: 10, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 4,
              }}>
                Your saved trip
              </span>
              <span style={{
                display: "block", fontFamily: theme.typography.fontDisplay,
                fontSize: isMobile ? 18 : 22, fontWeight: theme.typography.weightBold,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {itinerary.data.title}
              </span>
              <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>
                {itinerary.data.days?.length || 0} days
                {itinerary.data.totalBudget ? ` · ${itinerary.data.totalBudget}` : ""}
              </span>
            </span>
            <ChevronRight size={18} strokeWidth={2} style={{ flexShrink: 0, color: "rgba(255,255,255,0.7)" }} />
          </div>
        </div>
      )}

      {!loading && !error && places.length === 0 && !itinerary?.data && (
        <div style={{ padding: isMobile ? "0 16px 60px" : `0 ${theme.spacing.pagePadding} 60px` }}>
          <EmptyState
            icon="🤍"
            title="Nothing saved yet"
            subtitle="Tap the heart on any place in Explore to save it here for later."
            action={<PrimaryButton onClick={() => navigate("/explore")}>Browse Explore</PrimaryButton>}
          />
        </div>
      )}

      {!loading && !error && places.length === 0 && itinerary?.data && (
        <div style={{ padding: isMobile ? "0 16px 50px" : `0 ${theme.spacing.pagePadding} 50px`, fontSize: 13.5, color: theme.colors.textMuted }}>
          No saved places yet — tap the heart on any place in Explore to keep it here.
        </div>
      )}

      {!loading && !error && places.length > 0 && (
        <div
          style={{
            padding: isMobile ? "0 16px 60px" : `0 ${theme.spacing.pagePadding} 60px`,
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(260px, 1fr))",
            gap: isMobile ? 16 : 24,
          }}
        >
          {places.map((p) => (
            <div
              key={p.id}
              style={{
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radii.large || 14,
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/listings/${p.slug || p.id}`)}
            >
              <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden" }}>
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); unsave(p.id); }}
                  aria-label="Remove from saved places"
                  style={{
                    position: "absolute", top: 10, right: 10,
                    width: 34, height: 34, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.92)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  }}
                >
                  <Heart size={16} strokeWidth={2} fill="#C0392B" color="#C0392B" />
                </button>
              </div>
              <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                <h3 style={{
                  fontFamily: theme.typography.fontDisplay, fontSize: 18,
                  fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, margin: 0,
                }}>
                  {p.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: theme.colors.textMuted }}>
                  <MapPin size={12} strokeWidth={2} />
                  <span>{p.location}</span>
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
                  fontSize: 11.5, fontWeight: theme.typography.weightMedium,
                  letterSpacing: "0.05em", textTransform: "uppercase", color: theme.colors.textPrimary,
                }}>
                  View <ChevronRight size={12} strokeWidth={2} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPlacesPage;
