import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminGetBusinesses, adminDeleteBusiness, adminGetMe } from "../../services/api";
import SEO from "../../components/SEO/SEO";
import { theme } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";
import BusinessForm from "./BusinessForm";
import StoriesManager from "./StoriesManager";
import JournalManager from "./JournalManager";
import TeamManager from "./TeamManager";
import BeachForm from "./forms/BeachForm";
import FoodForm from "./forms/FoodForm";
import StayForm from "./forms/StayForm";
import HiddenGoaForm from "./forms/HiddenGoaForm";
import NightlifeForm from "./forms/NightlifeForm";
import sacredPlaces from "./forms/sacredPlaces";
import ArtGallery from "./forms/ArtGallery";
import TrendingManager from "./TrendingManager";

// Team is owner-only, so the tab list is built per signed-in admin rather
// than being a constant. Hiding it is cosmetic — the API enforces the rule.
const BASE_SECTIONS = ["businesses", "stories","trending", "journal"];
const SECTION_LABELS = {
  businesses: "Businesses", stories: "Stories", journal: "Journal",trending: "Trending", team: "Team",
};

// which clean, category-specific form to open for each listing type
const FORM_TYPES = [
  { key: "beaches",   label: "Beach",        Component: BeachForm },
  { key: "food",      label: "Food & Drink", Component: FoodForm },
  { key: "stays",     label: "Stay",         Component: StayForm },
  { key: "hidden",    label: "Hidden Goa",   Component: HiddenGoaForm },
  { key: "nightlife", label: "Nightlife",    Component: NightlifeForm },
  { key: "sacredPlaces",   label: "sacredPlaces", Component:  sacredPlaces},
  { key: "art", label: "Art Gallery", Component: ArtGallery },
];

// existing listings that don't fit one of the clean forms (e.g. activity, market, heritage)
// keep opening in the original full-field form so nothing becomes uneditable
const resolveFormType = (biz) => {
  if (!biz) return null;
  if (biz.tags?.includes("hidden")) return "hidden";
  if (biz.category === "beach") return "beaches";
  if (["restaurant", "cafe"].includes(biz.category)) return "food";
  if (["hotel", "stay"].includes(biz.category)) return "stays";
  if (biz.category === "nightlife") return "nightlife";
  if (biz.category === "spiritual") return "sacredPlaces";
  if (["art-gallery", "museum", "library"].includes(biz.category)) return "art"; 
  return "other";
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [section, setSection] = useState("businesses");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [editingBusiness, setEditingBusiness] = useState(null); // null = create mode
  const [activeFormType, setActiveFormType] = useState(null); // one of FORM_TYPES keys, or "other", or null = closed
  const [showAddMenu, setShowAddMenu] = useState(false);
  // Who is signed in — drives whether the Team tab is offered at all.
  const [me, setMe] = useState(null);
  const SECTIONS = me?.role === "owner" ? [...BASE_SECTIONS, "team"] : BASE_SECTIONS;

  useEffect(() => {
    const token = localStorage.getItem("trugoa_admin_token");
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchBusinesses();
    adminGetMe()
      .then(setMe)
      // A token that no longer resolves to an active account means access was
      // revoked (or it expired), so send them back to the login screen.
      .catch(() => { localStorage.removeItem("trugoa_admin_token"); navigate("/admin"); });
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setBusinesses(await adminGetBusinesses());
    } catch (err) {
      if (err.message.includes("401")) navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (biz) => {
    if (!window.confirm(`Delete "${biz.name}"? This cannot be undone.`)) return;
    setDeletingId(biz._id);
    try {
      await adminDeleteBusiness(biz._id);
      setBusinesses(prev => prev.filter(b => b._id !== biz._id));
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateBusiness = (formType) => {
    setEditingBusiness(null);
    setActiveFormType(formType);
    setShowAddMenu(false);
  };
  const openEditBusiness = (biz) => {
    setEditingBusiness(biz);
    setActiveFormType(resolveFormType(biz));
  };
  const closeBusinessForm = () => setActiveFormType(null);
  const handleBusinessSaved = () => fetchBusinesses();

  const handleLogout = () => {
    localStorage.removeItem("trugoa_admin_token");
    navigate("/admin");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(b =>
      b.name?.toLowerCase().includes(q) ||
      b.location?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q)
    );
  }, [businesses, search]);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: theme.colors.bgPage,
      fontFamily: theme.typography.fontBody,
    }}>
      <SEO path="/admin/dashboard" title="Admin Dashboard" noindex />

      {/* ── SIDEBAR ───────────────────────────────────── */}
      <div
        style={{
          width: 240,
          background: theme.colors.bgDark,
          color: "white",
          padding: "28px 18px",
          display: isMobile ? "none" : "flex",
          flexDirection: "column",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <div style={{ marginBottom: 44, padding: "0 6px" }}>
          <div style={{ fontFamily: theme.typography.fontDisplay, fontSize: 22, fontWeight: 800 }}>
            TruGoa Admin
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            Content Dashboard
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {SECTIONS.map((s) => {
            const active = section === s;
            return (
              <button
                key={s}
                onClick={() => setSection(s)}
                style={{
                  border: "none",
                  background: active ? theme.colors.primary : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.65)",
                  padding: "13px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  textAlign: "left",
                  transition: theme.transitions.fast,
                }}
              >
                {SECTION_LABELS[s]}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            border: "none",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.75)",
            padding: "13px 16px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ padding: isMobile ? "20px 16px" : `32px ${theme.spacing.pagePadding}`, flex: 1, minWidth: 0 }}>

        {/* mobile section switcher — sidebar is hidden below desktop width */}
        {isMobile && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                style={{
                  border: "none",
                  background: section === s ? theme.colors.primary : theme.colors.bgSurface,
                  color: section === s ? "white" : theme.colors.textBody,
                  padding: "10px 16px", borderRadius: theme.radii.pill,
                  cursor: "pointer", fontSize: 13, fontWeight: 700,
                }}
              >
                {SECTION_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {section === "stories" ? (
          <StoriesManager isMobile={isMobile} />
        ) : section === "journal" ? (
          <JournalManager isMobile={isMobile} />
        ) : section === "trending" ? (
          <TrendingManager isMobile={isMobile} />
        ): section === "team" ? (
          <TeamManager isMobile={isMobile} me={me} />
        ) : (
        <>
          {/* ── HEADER ─────────────────────────────────── */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
            gap: 16, marginBottom: 28,
          }}>
            <div>
              <div style={{
                fontFamily: theme.typography.fontDisplay, fontSize: 26,
                fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
              }}>
                Businesses
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
                {businesses.length} listing{businesses.length === 1 ? "" : "s"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, location or category..."
                style={{
                  flex: 1, minWidth: isMobile ? 0 : 260,
                  padding: "11px 16px", border: `1.5px solid ${theme.colors.borderLight}`,
                  borderRadius: theme.radii.md, fontSize: 14,
                  fontFamily: theme.typography.fontBody, color: theme.colors.textPrimary,
                  background: "white",
                }}
              />
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                  onClick={() => setShowAddMenu(v => !v)}
                  style={{
                    background: theme.colors.primary, color: "white", border: "none",
                    borderRadius: theme.radii.md, padding: "11px 22px", fontSize: 14,
                    fontWeight: theme.typography.weightBold, cursor: "pointer",
                    fontFamily: theme.typography.fontBody, whiteSpace: "nowrap",
                  }}
                >
                  + Add Business
                </button>

                {showAddMenu && (
                  <>
                    <div onClick={() => setShowAddMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 899 }} />
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 900,
                      background: "white", border: `1px solid ${theme.colors.borderLight}`,
                      borderRadius: theme.radii.md, boxShadow: theme.shadows.card,
                      minWidth: 180, overflow: "hidden",
                    }}>
                      {FORM_TYPES.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => openCreateBusiness(key)}
                          style={{
                            display: "block", width: "100%", textAlign: "left",
                            background: "none", border: "none", cursor: "pointer",
                            padding: "11px 16px", fontSize: 14, color: theme.colors.textPrimary,
                            fontFamily: theme.typography.fontBody,
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── CONTENT ────────────────────────────────── */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
              <div style={{
                fontFamily: theme.typography.fontDisplay, fontSize: 18,
                fontWeight: theme.typography.weightBold, color: theme.colors.secondary,
              }}>
                Loading listings...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{businesses.length === 0 ? "🏝️" : "🔍"}</div>
              <div style={{
                fontFamily: theme.typography.fontDisplay, fontSize: 18,
                fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: 6,
              }}>
                {businesses.length === 0 ? "No businesses yet" : "No matches"}
              </div>
              <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
                {businesses.length === 0 ? "Add your first listing to get started." : "Try a different search term."}
              </div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}>
              {filtered.map(biz => (
                <div key={biz._id} style={{
                  background: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: theme.radii.lg,
                  overflow: "hidden",
                  boxShadow: theme.shadows.card,
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{
                    aspectRatio: "16 / 10", background: theme.colors.bgSurface,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
                  }}>
                    {biz.heroImage || biz.gallery?.length > 0 ? (
                      <img
                        src={biz.heroImage || biz.gallery[0]}
                        alt={biz.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : "🏪"}
                  </div>

                  <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <span style={{
                        fontFamily: theme.typography.fontDisplay, fontSize: 17,
                        fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, lineHeight: 1.25,
                      }}>
                        {biz.name}
                      </span>
                      {biz.category && (
                        <span style={{
                          background: theme.colors.primaryLight, color: theme.colors.primaryText,
                          borderRadius: theme.radii.pill, padding: "2px 10px", fontSize: 10.5,
                          fontWeight: theme.typography.weightBold, textTransform: "uppercase",
                          whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          {biz.category}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, color: theme.colors.textMuted }}>📍 {biz.location}</div>
                    {biz.priceRange && (
                      <div style={{ fontSize: 13, color: theme.colors.textMuted }}>💰 {biz.priceRange}</div>
                    )}
                    {biz.description && (
                      <div style={{
                        fontSize: 13, color: theme.colors.textBody, lineHeight: 1.55,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        marginTop: 2,
                      }}>
                        {biz.description}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 12 }}>
                      <button
                        onClick={() => openEditBusiness(biz)}
                        style={{
                          flex: 1, background: theme.colors.bgSurface, color: theme.colors.textBody,
                          border: `1.5px solid ${theme.colors.borderLight}`, borderRadius: theme.radii.md,
                          padding: "9px 0", fontSize: 13, fontWeight: theme.typography.weightBold,
                          fontFamily: theme.typography.fontBody, cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(biz)}
                        disabled={deletingId === biz._id}
                        style={{
                          flex: 1, background: theme.colors.dangerBg, color: theme.colors.danger,
                          border: `1.5px solid ${theme.colors.danger}40`, borderRadius: theme.radii.md,
                          padding: "9px 0", fontSize: 13, fontWeight: theme.typography.weightBold,
                          fontFamily: theme.typography.fontBody,
                          cursor: deletingId === biz._id ? "not-allowed" : "pointer",
                        }}
                      >
                        {deletingId === biz._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
        )}
      </div>

      {activeFormType && activeFormType !== "other" && (() => {
        const { Component } = FORM_TYPES.find(t => t.key === activeFormType);
        return (
          <Component
            business={editingBusiness}
            onClose={closeBusinessForm}
            onSaved={handleBusinessSaved}
          />
        );
      })()}

      {activeFormType === "other" && (
        <BusinessForm
          business={editingBusiness}
          onClose={closeBusinessForm}
          onSaved={handleBusinessSaved}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
