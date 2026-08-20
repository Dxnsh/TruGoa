import { useState, useEffect } from "react";
import { theme } from "../../Theme";
import { adminGetJournals, adminGetJournal, adminUpdateJournal, adminDeleteJournal } from "../../services/api";
import JournalForm from "./JournalForm";

const JournalManager = ({ isMobile }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // full entry being edited, or null for create
  const [loadingEdit, setLoadingEdit] = useState(null); // id currently being fetched for edit
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // The admin list includes drafts — the public one doesn't.
  const fetchEntries = async () => {
    try {
      setLoading(true);
      setEntries(await adminGetJournals());
    } catch {
      // leave entries as-is; list will just show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const openCreate = () => { setEditing(null); setShowForm(true); };

  const openEdit = async (summary) => {
    setLoadingEdit(summary._id);
    try {
      const full = await adminGetJournal(summary._id);
      setEditing(full);
      setShowForm(true);
    } catch {
      alert("Failed to load this entry. Please try again.");
    } finally {
      setLoadingEdit(null);
    }
  };

  const togglePublished = async (entry) => {
    const next = !entry.published;
    if (!next && !window.confirm(`Unpublish "${entry.title}"? It will disappear from the public journal.`)) return;

    setPublishingId(entry._id);
    try {
      await adminUpdateJournal(entry._id, { published: next });
      setEntries(prev => prev.map(e => (e._id === entry._id ? { ...e, published: next } : e)));
    } catch {
      alert(`Failed to ${next ? "publish" : "unpublish"}. Please try again.`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    setDeletingId(entry._id);
    try {
      await adminDeleteJournal(entry._id);
      setEntries(prev => prev.filter(e => e._id !== entry._id));
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    fetchEntries();
  };

  const publishedCount = entries.filter(e => e.published).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 20,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
          }}>
            Journal
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
            {entries.length} entr{entries.length === 1 ? "y" : "ies"} · {publishedCount} published
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
          + New Entry
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 18,
            fontWeight: theme.typography.weightBold, color: theme.colors.secondary,
          }}>
            Loading journal...
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 18,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: 6,
          }}>
            No entries yet
          </div>
          <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
            Write your first one to get started.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {entries.map(entry => (
            <div key={entry._id} style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.lg, padding: 20,
              boxShadow: theme.shadows.card,
              display: "flex", flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 12 : 16, alignItems: isMobile ? "stretch" : "center",
              // Drafts read as unfinished at a glance.
              opacity: entry.published ? 1 : 0.72,
            }}>
              <div style={{
                width: 80, height: 80, flexShrink: 0, borderRadius: theme.radii.md,
                overflow: "hidden", background: theme.colors.bgSurface,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
              }}>
                {entry.coverImage ? (
                  <img src={entry.coverImage} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : "📝"}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: theme.typography.fontDisplay, fontSize: 16,
                    fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
                  }}>
                    {entry.title}
                  </span>
                  <span style={{
                    borderRadius: theme.radii.pill, padding: "3px 10px", fontSize: 11,
                    fontWeight: theme.typography.weightBold, letterSpacing: 0.4,
                    textTransform: "uppercase",
                    background: entry.published ? theme.colors.primaryLight : theme.colors.bgSurface,
                    color: entry.published ? theme.colors.primaryText : theme.colors.textMuted,
                    border: `1px solid ${entry.published ? "transparent" : theme.colors.borderLight}`,
                  }}>
                    {entry.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>
                  /journal/{entry.slug}
                </div>
                {entry.excerpt && (
                  <div style={{
                    fontSize: 13, color: theme.colors.textBody, lineHeight: 1.5, maxWidth: 500,
                    whiteSpace: "pre-line", overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {entry.excerpt}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto", flexShrink: 0 }}>
                <button
                  onClick={() => togglePublished(entry)}
                  disabled={publishingId === entry._id}
                  style={{
                    background: entry.published ? theme.colors.bgSurface : theme.colors.primary,
                    color: entry.published ? theme.colors.textBody : "white",
                    border: `1.5px solid ${entry.published ? theme.colors.borderLight : "transparent"}`,
                    borderRadius: theme.radii.md,
                    padding: "10px 20px", fontSize: 13, fontWeight: theme.typography.weightBold,
                    fontFamily: theme.typography.fontBody,
                    cursor: publishingId === entry._id ? "not-allowed" : "pointer",
                  }}
                >
                  {publishingId === entry._id ? "..." : entry.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => openEdit(entry)}
                  disabled={loadingEdit === entry._id}
                  style={{
                    background: theme.colors.bgSurface, color: theme.colors.textBody,
                    border: `1.5px solid ${theme.colors.borderLight}`, borderRadius: theme.radii.md,
                    padding: "10px 20px", fontSize: 13, fontWeight: theme.typography.weightBold,
                    fontFamily: theme.typography.fontBody,
                    cursor: loadingEdit === entry._id ? "not-allowed" : "pointer",
                  }}
                >
                  {loadingEdit === entry._id ? "Loading..." : "Edit"}
                </button>
                <button
                  onClick={() => handleDelete(entry)}
                  disabled={deletingId === entry._id}
                  style={{
                    background: theme.colors.dangerBg, color: theme.colors.danger,
                    border: `1.5px solid ${theme.colors.danger}40`, borderRadius: theme.radii.md,
                    padding: "10px 20px", fontSize: 13, fontWeight: theme.typography.weightBold,
                    fontFamily: theme.typography.fontBody,
                    cursor: deletingId === entry._id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === entry._id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <JournalForm
          entry={editing}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default JournalManager;
