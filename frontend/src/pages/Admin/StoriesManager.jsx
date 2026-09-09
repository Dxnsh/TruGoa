import { useState, useEffect } from "react";
import { theme } from "../../Theme";
import { adminGetStories, adminGetStory, adminUpdateStory, adminDeleteStory } from "../../services/api";
import StoryForm from "./StoryForm";

const StoriesManager = ({ isMobile }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // full story doc being edited, or null for create
  const [loadingEdit, setLoadingEdit] = useState(null); // slug currently being fetched for edit
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // The admin list includes drafts — the public one doesn't.
  const fetchStories = async () => {
    try {
      setLoading(true);
      setStories(await adminGetStories());
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
      const full = await adminGetStory(summary.slug);
      setEditing(full);
      setShowForm(true);
    } catch {
      alert("Failed to load this story collection. Please try again.");
    } finally {
      setLoadingEdit(null);
    }
  };

  const togglePublished = async (story) => {
    const next = !story.published;
    if (!next && !window.confirm(`Unpublish "${story.title}"? It will disappear from the public Stories page.`)) return;

    setPublishingId(story._id);
    try {
      await adminUpdateStory(story._id, { published: next });
      setStories(prev => prev.map(s => (s._id === story._id ? { ...s, published: next } : s)));
    } catch {
      alert(`Failed to ${next ? "publish" : "unpublish"}. Please try again.`);
    } finally {
      setPublishingId(null);
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
            {stories.length} collection{stories.length === 1 ? "" : "s"} · {stories.filter(s => s.published).length} published
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
              // Drafts read as unfinished at a glance.
              opacity: story.published ? 1 : 0.72,
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
                  <span style={{
                    borderRadius: theme.radii.pill, padding: "3px 10px", fontSize: 11,
                    fontWeight: theme.typography.weightBold, letterSpacing: 0.4,
                    textTransform: "uppercase",
                    background: story.published ? theme.colors.primaryLight : theme.colors.bgSurface,
                    color: story.published ? theme.colors.primaryText : theme.colors.textMuted,
                    border: `1px solid ${story.published ? "transparent" : theme.colors.borderLight}`,
                  }}>
                    {story.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>
                  /{story.slug}
                </div>
                {story.desc && (
                  <div style={{
                    fontSize: 13, color: theme.colors.textBody, lineHeight: 1.5, maxWidth: 500,
                    whiteSpace: "pre-line", overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {story.desc}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto", flexShrink: 0 }}>
                <button
                  onClick={() => togglePublished(story)}
                  disabled={publishingId === story._id}
                  style={{
                    background: story.published ? theme.colors.bgSurface : theme.colors.primary,
                    color: story.published ? theme.colors.textBody : "white",
                    border: `1.5px solid ${story.published ? theme.colors.borderLight : "transparent"}`,
                    borderRadius: theme.radii.md,
                    padding: "10px 20px", fontSize: 13, fontWeight: theme.typography.weightBold,
                    fontFamily: theme.typography.fontBody,
                    cursor: publishingId === story._id ? "not-allowed" : "pointer",
                  }}
                >
                  {publishingId === story._id ? "..." : story.published ? "Unpublish" : "Publish"}
                </button>
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
