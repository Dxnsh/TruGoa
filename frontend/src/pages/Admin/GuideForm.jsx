import { useState, useRef } from "react";
import { theme } from "../../Theme";
import { adminCreateBlog, adminUpdateBlog } from "../../services/api";
import { inputStyle, labelStyle } from "./adminFormKit";
import { SingleImageUpload } from "./ImageUpload";

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const blankForm = {
  slug: "", title: "", excerpt: "", content: "", coverImage: "",
  author: "", readTime: "", tags: "",
};

const toFormState = (guide) => ({
  ...blankForm,
  ...guide,
  tags: (guide.tags || []).join(", "),
});

const toolbarBtnStyle = {
  background: theme.colors.bgSurface, color: theme.colors.textBody,
  border: `1px solid ${theme.colors.borderLight}`, borderRadius: theme.radii.sm || 4,
  padding: "6px 12px", fontSize: 13, cursor: "pointer",
  fontFamily: theme.typography.fontBody,
};

/* wraps the current textarea selection with `marker` on both sides —
   e.g. selecting "beach" and clicking Bold turns it into "**beach**" */
const wrapSelection = (textareaRef, marker, setValue) => {
  const el = textareaRef.current;
  if (!el) return;
  const { selectionStart, selectionEnd, value } = el;
  const selected = value.slice(selectionStart, selectionEnd) || "text";
  const next = value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(selectionStart + marker.length, selectionStart + marker.length + selected.length);
  });
};

const GuideForm = ({ guide, onClose, onSaved }) => {
  const isEdit = !!guide?._id;
  const [form, setForm] = useState(guide ? toFormState(guide) : blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.title.trim() || !form.content.trim() || !form.coverImage.trim()) {
      setError("Slug, title, content and cover image are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    try {
      const saved = isEdit
        ? await adminUpdateBlog(guide._id, payload)
        : await adminCreateBlog(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 900 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 901, background: "white", borderRadius: theme.radii.xl,
        width: "94%", maxWidth: 720, maxHeight: "88vh", overflowY: "auto",
        boxShadow: theme.shadows.modal, border: `1px solid ${theme.colors.borderLight}`,
        fontFamily: theme.typography.fontBody,
      }}>
        <div style={{
          position: "sticky", top: 0, background: "white", zIndex: 1,
          padding: "20px 28px", borderBottom: `1px solid ${theme.colors.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 20,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, margin: 0,
          }}>
            {isEdit ? `Edit ${guide.title}` : "New Guide"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: theme.colors.textMuted, cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Title *"><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} /></Field>
            <Field label="Slug *"><input style={inputStyle} value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="my-first-guide" /></Field>
          </div>

          <Field label="Excerpt">
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.excerpt} onChange={e => set("excerpt", e.target.value)} />
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
              Shown on the guides listing and used for search/social previews.
            </div>
          </Field>

          <SingleImageUpload label="Cover Image *" value={form.coverImage} onChange={url => set("coverImage", url)} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Author"><input style={inputStyle} value={form.author} onChange={e => set("author", e.target.value)} placeholder="TruGoa Team" /></Field>
            <Field label="Read Time"><input style={inputStyle} value={form.readTime} onChange={e => set("readTime", e.target.value)} placeholder="5 min read" /></Field>
          </div>

          <Field label="Tags (comma-separated)">
            <input style={inputStyle} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="food, hidden-gems" />
          </Field>

          <Field label="Content *">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button type="button" style={{ ...toolbarBtnStyle, fontWeight: 700 }}
                onClick={() => wrapSelection(contentRef, "**", v => set("content", v))}>
                B
              </button>
              <button type="button" style={{ ...toolbarBtnStyle, fontStyle: "italic" }}
                onClick={() => wrapSelection(contentRef, "*", v => set("content", v))}>
                i
              </button>
            </div>
            <textarea
              ref={contentRef}
              style={{ ...inputStyle, minHeight: 220, fontFamily: "inherit" }}
              value={form.content}
              onChange={e => set("content", e.target.value)}
              placeholder="Write the full guide here. Select text and click B or i to format it. Blank lines start a new paragraph."
            />
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
              Select text and click B (bold) or i (italic) — this inserts **bold** / *italic* markers that render as formatted text on the published guide.
            </div>
          </Field>

          {error && (
            <div style={{
              background: theme.colors.dangerBg, border: `1px solid ${theme.colors.danger}40`,
              borderRadius: theme.radii.md, padding: "10px 14px", fontSize: 13,
              color: theme.colors.danger, margin: "16px 0",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{
              background: "none", border: `1.5px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.md, padding: "12px 22px", fontSize: 14,
              fontWeight: theme.typography.weightMedium, color: theme.colors.textBody,
              cursor: "pointer", fontFamily: theme.typography.fontBody,
            }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{
              background: saving ? theme.colors.borderLight : theme.colors.primary,
              border: "none", borderRadius: theme.radii.md, padding: "12px 26px", fontSize: 14,
              fontWeight: theme.typography.weightBold, color: "white",
              cursor: saving ? "not-allowed" : "pointer", fontFamily: theme.typography.fontBody,
            }}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Guide"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default GuideForm;
