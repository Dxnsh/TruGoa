import { useState, useEffect } from "react";
import { theme } from "../../Theme";
import { getStories, getStoryBySlug, adminDeleteStory } from "../../services/api";
import StoryForm from "./StoryForm";

const StoriesManager = ({ isMobile }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // full story doc being edited, or null for create
  const [loadingEdit, setLoadingEdit] = useState(null); // slug currently being fetched for edit
  const [deletingId, setDeletingId] = useState(null);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setStories(await getStories());
    } catch {
      // leave stories as-is; list will just show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  const openCreate = () => { setEditing(null); setShowForm(true); };

  const openEdit = async (summary) => {
    setLoadingEdit(summary.slug);
    try {
      const full = await getStoryBySlug(summary.slug);
      setEditing(full);
      setShowForm(true);
    } catch {
      alert("Failed to load this story collection. Please try again.");
    } finally {
      setLoadingEdit(null);
    }
  };

  const handleDelete = async (story) => {
    if (!window.confirm(`Delete "${story.title}"? This cannot be undone.`)) return;
    setDeletingId(story._id);
    try {
      await adminDeleteStory(story._id);
      setStories(prev => prev.filter(s => s._id !== story._id));
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    fetchStories();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 20,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
          }}>
            Story Collections
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
            {stories.length} collection{stories.length === 1 ? "" : "s"}
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
          + New Story Collection
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 18,
            fontWeight: theme.typography.weightBold, color: theme.colors.secondary,
          }}>
            Loading story collections...
          </div>
        </div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 18,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: 6,
          }}>
            No story collections yet
          </div>
          <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
            Create your first one to get started.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {stories.map(story => (
            <div key={story._id} style={{
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
                {story.image ? (
                  <img src={story.image} alt={story.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : "📖"}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: theme.typography.fontDisplay, fontSize: 16,
                    fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
                  }}>
                    {story.title}
                  </span>
                  <span style={{
                    background: theme.colors.primaryLight, color: theme.colors.primaryText,
                    borderRadius: theme.radii.pill, padding: "2px 10px", fontSize: 11,
                    fontWeight: theme.typography.weightBold, textTransform: "uppercase",
                  }}>
                    {story.category}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>
                  /{story.slug}
                </div>
                {story.desc && (
                  <div style={{ fontSize: 13, color: theme.colors.textBody, lineHeight: 1.5, maxWidth: 500 }}>
                    {story.desc}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto", flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(story)}
                  disabled={loadingEdit === story.slug}
                  style={{
                    background: theme.colors.bgSurface, color: theme.colors.textBody,
                    border: `1.5px solid ${theme.colors.borderLight}`, borderRadius: theme.radii.md,
                    padding: "10px 20px", fontSize: 13, fontWeight: theme.typography.weightBold,
                    fontFamily: theme.typography.fontBody,
                    cursor: loadingEdit === story.slug ? "not-allowed" : "pointer",
                  }}
                >
                  {loadingEdit === story.slug ? "Loading..." : "Edit"}
                </button>
                <button
                  onClick={() => handleDelete(story)}
                  disabled={deletingId === story._id}
                  style={{
                    background: theme.colors.dangerBg, color: theme.colors.danger,
                    border: `1.5px solid ${theme.colors.danger}40`, borderRadius: theme.radii.md,
                    padding: "10px 20px", fontSize: 13, fontWeight: theme.typography.weightBold,
                    fontFamily: theme.typography.fontBody,
                    cursor: deletingId === story._id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === story._id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <StoryForm
          story={editing}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default StoriesManager;
