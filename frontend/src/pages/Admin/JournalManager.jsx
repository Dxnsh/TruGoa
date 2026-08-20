import { useState, useEffect } from "react";
import { theme } from "../../Theme";
import { getBlogs, getBlogBySlug, adminDeleteBlog } from "../../services/api";
import GuideForm from "./GuideForm";

const GuidesManager = ({ isMobile }) => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // full guide doc being edited, or null for create
  const [loadingEdit, setLoadingEdit] = useState(null); // slug currently being fetched for edit
  const [deletingId, setDeletingId] = useState(null);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      setGuides(await getBlogs());
    } catch {
      // leave guides as-is; list will just show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuides(); }, []);

  const openCreate = () => { setEditing(null); setShowForm(true); };

  const openEdit = async (summary) => {
    setLoadingEdit(summary.slug);
    try {
      const full = await getBlogBySlug(summary.slug);
      setEditing(full);
      setShowForm(true);
    } catch {
      alert("Failed to load this guide. Please try again.");
    } finally {
      setLoadingEdit(null);
    }
  };

  const handleDelete = async (guide) => {
    if (!window.confirm(`Delete "${guide.title}"? This cannot be undone.`)) return;
    setDeletingId(guide._id);
    try {
      await adminDeleteBlog(guide._id);
      setGuides(prev => prev.filter(g => g._id !== guide._id));
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    fetchGuides();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 20,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
          }}>
            Guides
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
            {guides.length} guide{guides.length === 1 ? "" : "s"}
          </div>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: theme.colors.primary, color: "white", border: "none",
            borderRadius: theme.radii.md, padding: "12px 22px", fontSize: 14,
            fontWeight: theme.typography.weightBold, cursor: "pointer",
            fontFamily: theme.typography.fontBody,
          }}
        >
          + New Guide
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 18,
            fontWeight: theme.typography.weightBold, color: theme.colors.secondary,
          }}>
            Loading guides...
          </div>
        </div>
      ) : guides.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 18,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: 6,
          }}>
            No guides yet
          </div>
          <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
            Create your first one to get started.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {guides.map(guide => (
            <div key={guide._id} style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.lg, padding: 20,
              boxShadow: theme.shadows.card,
              display: "flex", flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 12 : 16, alignItems: isMobile ? "stretch" : "center",
            }}>
              <div style={{
                width: 80, height: 80, flexShrink: 0, borderRadius: theme.radii.md,
                overflow: "hidden", background: theme.colors.bgSurface,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
              }}>
                {guide.coverImage ? (
                  <img src={guide.coverImage} alt={guide.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : "📝"}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: theme.typography.fontDisplay, fontSize: 16,
                    fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
                  }}>
                    {guide.title}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>
                  /guides/{guide.slug}
                </div>
                {guide.excerpt && (
                  <div style={{
                    fontSize: 13, color: theme.colors.textBody, lineHeight: 1.5, maxWidth: 500,
                    whiteSpace: "pre-line", overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {guide.excerpt}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto", flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(guide)}
                  disabled={loadingEdit === guide.slug}
                  style={{
                    background: theme.colors.bgSurface, color: theme.colors.textBody,
                    border: `1.5px solid ${theme.colors.borderLight}`, borderRadius: theme.radii.md,
                    padding: "10px 20px", fontSize: 13, fontWeight: theme.typography.weightBold,
                    fontFamily: theme.typography.fontBody,
                    cursor: loadingEdit === guide.slug ? "not-allowed" : "pointer",
                  }}
                >
                  {loadingEdit === guide.slug ? "Loading..." : "Edit"}
                </button>
                <button
                  onClick={() => handleDelete(guide)}
                  disabled={deletingId === guide._id}
                  style={{
                    background: theme.colors.dangerBg, color: theme.colors.danger,
                    border: `1.5px solid ${theme.colors.danger}40`, borderRadius: theme.radii.md,
                    padding: "10px 20px", fontSize: 13, fontWeight: theme.typography.weightBold,
                    fontFamily: theme.typography.fontBody,
                    cursor: deletingId === guide._id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === guide._id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <GuideForm
          guide={editing}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default GuidesManager;
