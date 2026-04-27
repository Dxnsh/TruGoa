import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BizCard from "../../components/BizCard/BizCard";
import { getBusinesses } from "../../services/api";
import { mapBusiness } from "../../services/mapper";
import { theme } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";
import { PrimaryButton, LoadingState, EmptyState } from "../../Theme";

const FILTERS = ["All", "Restaurant", "Cafes", "Hotels & Stay", "Activities", "Markets", "Beaches", "Verified Only"];

const ListingPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  // ✅ read category and search from URL on load
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");
    if (categoryFromUrl) setActiveFilter(categoryFromUrl);
    if (searchFromUrl) setSearch(searchFromUrl);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusinesses();
        const mapped = data.map((biz, index) => mapBusiness(biz, index));
        setBusinesses(mapped);
      } catch (err) {
        setError("Could not load listings. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ matchFilter is INSIDE the component, used inside filtered
  const categoryMap = {
  Restaurant: "restaurant",
  Cafes: "cafe",
  "Hotels & Stay": ["hotel", "stay"],
  Activities: "activity",
  Markets: "market",
  Beaches: "beach",
};

  const filtered = businesses.filter((b) => {
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "Verified Only" && b.trust === "verified") ||
      (() => {
        const map = categoryMap[activeFilter];

        if (!map) return false;

        if (Array.isArray(map)) {
          return map.includes(b.category?.toLowerCase());
        }

        return b.category?.toLowerCase() === map;
      })();

    return matchSearch && matchFilter;
  });

  return (
    <div style={{ fontFamily: theme.typography.fontBody, background: theme.colors.bgPage, minHeight: "100vh" }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondaryDark} 100%)`,
        padding: isMobile ? "24px 16px" : `clamp(32px,5vh,56px) ${theme.spacing.pagePadding}`,
      }}>
        
        {/* <button
          onClick={() => navigate("/")}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white", borderRadius: theme.radii.pill,
            padding: "8px 18px", cursor: "pointer",
            fontSize: 13, fontFamily: theme.typography.fontBody,
            fontWeight: theme.typography.weightMedium, marginBottom: 20,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
        >
          ← Back
        </button> */}

        <h1 style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: "clamp(28px,4vw,48px)",
          fontWeight: theme.typography.weightBlack,
          color: "white", letterSpacing: "-1px", marginBottom: 6,
        }}>
          {activeFilter === "All" ? "All Verified Places" : activeFilter}
        </h1>

        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          500+ businesses personally verified by our local team
        </p>

        <div style={{
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: theme.radii.lg,
          padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 10,
          maxWidth: 480,
        }}>
          <span style={{ fontSize: 16, opacity: 0.7 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search places, areas..."
            style={{
              background: "none", border: "none", outline: "none",
              color: "white", fontSize: 14, flex: 1,
              fontFamily: theme.typography.fontBody,
            }}
          />
          {search && (
            <span
              onClick={() => setSearch("")}
              style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 18 }}
            >
              ×
            </span>
          )}
        </div>
      </div>

      {/* ── FILTERS ────────────────────────────────────────── */}
      <div style={{
        background: theme.colors.bgCard,
        borderBottom: `1px solid ${theme.colors.borderLight}`,
        padding: isMobile ? "12px 16px" : `14px ${theme.spacing.pagePadding}`,
        display: "flex", gap: 10, overflowX: "auto",
        position: "sticky", top: 64, zIndex: 100,
        scrollbarWidth: "none",
      }}>
        {FILTERS.map(f => {
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "8px 18px", borderRadius: theme.radii.pill,
                fontSize: 13,
                fontWeight: isActive ? theme.typography.weightMedium : theme.typography.weightRegular,
                border: `1.5px solid ${isActive ? theme.colors.primary : theme.colors.borderLight}`,
                background: isActive ? theme.colors.primaryLight : "white",
                color: isActive ? theme.colors.primaryText : theme.colors.textBody,
                cursor: "pointer", whiteSpace: "nowrap",
                transition: theme.transitions.fast,
                fontFamily: theme.typography.fontBody,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = theme.colors.borderMedium; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = theme.colors.borderLight; }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? "20px 16px 80px" : `32px ${theme.spacing.pagePadding} 64px` }}>

        {loading && <LoadingState message="Loading verified places..." />}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 20, fontWeight: theme.typography.weightBold,
              color: theme.colors.textPrimary, marginBottom: 8,
            }}>
              Something went wrong
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 24 }}>
              {error}
            </div>
            <PrimaryButton onClick={() => window.location.reload()}>
              Try Again
            </PrimaryButton>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24, flexWrap: "wrap", gap: 10,
            }}>
              <div style={{ fontSize: 14, color: theme.colors.textMuted, fontWeight: theme.typography.weightMedium }}>
                Showing{" "}
                <span style={{ color: theme.colors.secondary, fontWeight: theme.typography.weightBold }}>
                  {filtered.length}
                </span>{" "}
                verified places
              </div>

              {(activeFilter !== "All" || search) && (
                <button
                  onClick={() => { setSearch(""); setActiveFilter("All"); }}
                  style={{
                    background: "none",
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: theme.radii.pill,
                    padding: "5px 14px", fontSize: 12,
                    color: theme.colors.textMuted,
                    cursor: "pointer", fontFamily: theme.typography.fontBody,
                  }}
                >
                  × Clear filters
                </button>
              )}
            </div>

            {filtered.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
              }}>
                {filtered.map(b => <BizCard key={b.id} biz={b} />)}
              </div>
            ) : (
              <EmptyState
                icon="🔍"
                title="No results found"
                subtitle="Try a different search term or filter"
                action={
                  <PrimaryButton onClick={() => { setSearch(""); setActiveFilter("All"); }}>
                    Clear filters
                  </PrimaryButton>
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ListingPage;