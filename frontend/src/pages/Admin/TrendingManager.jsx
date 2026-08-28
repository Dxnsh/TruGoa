import { useState, useEffect } from "react";
import { adminGetTrendingPlaces, adminDeleteTrendingPlace } from "../../services/api";
import { theme } from "../../Theme";
import TrendingForm from "./forms/TrendingForm";

const TrendingManager = ({ isMobile }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null); // null = closed
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setItems(await adminGetTrendingPlaces());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setEditingItem(null); setShowForm(true); };
  const openEdit = (item) => { setEditingItem(item); setShowForm(true); };
  const closeForm = () => setShowForm(false);
  const handleSaved = () => fetchItems();

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setDeletingId(item._id);
    try {
      await adminDeleteTrendingPlace(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
        gap: 16, marginBottom: 28,
      }}>
        <div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 26,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
          }}>
            Trending Places
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
            {items.length} place{items.length === 1 ? "" : "s"}
          </div>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: theme.colors.primary, color: "white", border: "none",
            borderRadius: theme.radii.md, padding: "11px 22px", fontSize: 14,
            fontWeight: theme.typography.weightBold, cursor: "pointer",
            fontFamily: theme.typography.fontBody, whiteSpace: "nowrap",
          }}
        >
          + Add Trending Place
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>Loading&hellip;</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔥</div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 18,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: 6,
          }}>
            No trending places yet
          </div>
          <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
            Add your first one to show it on the homepage.
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {items.map((item) => (
            <div key={item._id} style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.lg,
              overflow: "hidden",
              boxShadow: theme.shadows.card,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ aspectRatio: "16 / 10", background: theme.colors.bgSurface }}>
                {item.image && (
                  <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <span style={{
                    fontFamily: theme.typography.fontDisplay, fontSize: 17,
                    fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
                  }}>
                    {item.title}
                  </span>
                  <span style={{
                    background: theme.colors.primaryLight, color: theme.colors.primaryText,
                    borderRadius: theme.radii.pill, padding: "2px 10px", fontSize: 10.5,
                    fontWeight: theme.typography.weightBold, textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>
                    {item.badge}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted }}>📍 {item.location}</div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  {item.isActive ? "🟢 Active" : "⚪ Hidden"} · Loved by {item.lovedCount || 0}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 12 }}>
                  <button
                    onClick={() => openEdit(item)}
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
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item._id}
                    style={{
                      flex: 1, background: theme.colors.dangerBg, color: theme.colors.danger,
                      border: `1.5px solid ${theme.colors.danger}40`, borderRadius: theme.radii.md,
                      padding: "9px 0", fontSize: 13, fontWeight: theme.typography.weightBold,
                      fontFamily: theme.typography.fontBody,
                      cursor: deletingId === item._id ? "not-allowed" : "pointer",
                    }}
                  >
                    {deletingId === item._id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TrendingForm
          trendingItem={editingItem}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};

export default TrendingManager;